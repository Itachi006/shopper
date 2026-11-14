package com.shopeasy.service;

import com.shopeasy.dto.Dtos.VerifyRequest;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.*;
import com.shopeasy.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

/**
 * Razorpay integration.
 * - If razorpay.key-id / key-secret are set -> real Razorpay (use TEST keys while learning).
 * - If they are empty -> DEMO mode: the frontend shows a "Simulate payment" button, so the whole
 *   flow can be tested without any gateway account.
 */
@Service
public class PaymentService {
    private final OrderRepository orderRepo;
    private final RestTemplate rest = new RestTemplate();

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    public PaymentService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    private boolean demoMode() {
        return keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank();
    }

    @Transactional
    public Map<String, Object> createPayment(User user, Long orderId) {
        Order o = orderRepo.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (o.getPaymentMethod() != PaymentMethod.ONLINE || o.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This order does not need an online payment");
        }

        long amountPaise = o.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", o.getId());
        result.put("amount", amountPaise);
        result.put("currency", "INR");

        if (demoMode()) {
            result.put("demo", true);
            return result;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(keyId, keySecret);
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", "INR");
        body.put("receipt", "order_" + o.getId());

        try {
            ResponseEntity<Map> res = rest.postForEntity("https://api.razorpay.com/v1/orders",
                    new HttpEntity<>(body, headers), Map.class);
            String rzpOrderId = (String) res.getBody().get("id");
            o.setRazorpayOrderId(rzpOrderId);
            orderRepo.save(o);
            result.put("demo", false);
            result.put("keyId", keyId);
            result.put("razorpayOrderId", rzpOrderId);
            return result;
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not reach the payment gateway. Check your Razorpay keys.");
        }
    }

    @Transactional
    public Order verifyPayment(User user, VerifyRequest req) {
        Order o = orderRepo.findByIdAndUser(req.orderId(), user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (o.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This order is not awaiting payment");
        }

        if (demoMode()) {
            o.setPaymentId("DEMO-" + System.currentTimeMillis());
        } else {
            if (o.getRazorpayOrderId() == null || req.razorpayPaymentId() == null || req.razorpaySignature() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Missing payment details");
            }
            String expected = hmacSha256(o.getRazorpayOrderId() + "|" + req.razorpayPaymentId(), keySecret);
            boolean ok = MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    req.razorpaySignature().getBytes(StandardCharsets.UTF_8));
            if (!ok) {
                o.setPaymentStatus("FAILED");
                orderRepo.save(o);
                throw new ApiException(HttpStatus.BAD_REQUEST, "Payment verification failed");
            }
            o.setPaymentId(req.razorpayPaymentId());
        }

        o.setPaymentStatus("PAID");
        o.setStatus(OrderStatus.PAID);
        return orderRepo.save(o);
    }

    private static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

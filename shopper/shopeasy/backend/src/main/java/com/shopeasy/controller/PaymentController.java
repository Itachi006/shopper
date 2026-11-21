package com.shopeasy.controller;

import com.shopeasy.dto.Dtos.VerifyRequest;
import com.shopeasy.model.Order;
import com.shopeasy.model.User;
import com.shopeasy.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    /** Step 1: create a gateway order for an ONLINE order awaiting payment. */
    @PostMapping("/create/{orderId}")
    public Map<String, Object> create(@AuthenticationPrincipal User user, @PathVariable Long orderId) {
        return service.createPayment(user, orderId);
    }

    /** Step 2: after the customer pays, verify the signature and mark the order PAID. */
    @PostMapping("/verify")
    public Order verify(@AuthenticationPrincipal User user, @Valid @RequestBody VerifyRequest r) {
        return service.verifyPayment(user, r);
    }
}

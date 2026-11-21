package com.shopeasy.service;

import com.shopeasy.dto.Dtos.CheckoutRequest;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.*;
import com.shopeasy.repository.CartItemRepository;
import com.shopeasy.repository.OrderRepository;
import com.shopeasy.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {
    private static final BigDecimal FREE_SHIPPING_ABOVE = new BigDecimal("999");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("50");

    private final OrderRepository orderRepo;
    private final CartItemRepository cartRepo;
    private final ProductRepository productRepo;

    public OrderService(OrderRepository orderRepo, CartItemRepository cartRepo, ProductRepository productRepo) {
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
        this.productRepo = productRepo;
    }

    @Transactional
    public Order checkout(User user, CheckoutRequest r) {
        List<CartItem> cart = cartRepo.findByUserOrderByIdAsc(user);
        if (cart.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Your cart is empty");

        Order order = new Order();
        order.setUser(user);
        order.setShipName(r.name().trim());
        order.setShipPhone(r.phone().trim());
        order.setShipAddress(r.address().trim());
        order.setShipCity(r.city().trim());
        order.setShipPincode(r.pincode().trim());
        order.setPaymentMethod(r.paymentMethod());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : cart) {
            Product p = productRepo.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "A product in your cart no longer exists"));
            if (!p.isActive() || p.getStock() < ci.getQuantity()) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Not enough stock for \"" + p.getName() + "\" (available: " + p.getStock() + ")");
            }
            p.setStock(p.getStock() - ci.getQuantity());

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(p);
            oi.setProductName(p.getName());
            oi.setPrice(p.getPrice());
            oi.setQuantity(ci.getQuantity());
            order.getItems().add(oi);

            subtotal = subtotal.add(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        BigDecimal shipping = subtotal.compareTo(FREE_SHIPPING_ABOVE) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;
        order.setSubtotal(subtotal);
        order.setShippingFee(shipping);
        order.setTotalAmount(subtotal.add(shipping));

        if (r.paymentMethod() == PaymentMethod.COD) {
            order.setStatus(OrderStatus.PLACED);
        } else {
            order.setStatus(OrderStatus.PENDING_PAYMENT);
        }

        Order saved = orderRepo.save(order);
        cartRepo.deleteAll(cart);
        return saved;
    }

    public Order getOwned(User user, Long orderId) {
        return orderRepo.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @Transactional
    public Order cancelByCustomer(User user, Long orderId) {
        Order o = getOwned(user, orderId);
        if (o.getStatus() != OrderStatus.PLACED && o.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This order can no longer be cancelled");
        }
        return changeStatus(o, OrderStatus.CANCELLED);
    }

    @Transactional
    public Order updateStatus(Long orderId, OrderStatus status) {
        Order o = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        return changeStatus(o, status);
    }

    private Order changeStatus(Order o, OrderStatus status) {
        if (o.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cancelled order cannot be changed");
        }
        if (status == OrderStatus.CANCELLED) {
            // put the stock back
            for (OrderItem oi : o.getItems()) {
                Product p = productRepo.findById(oi.getProduct().getId()).orElse(null);
                if (p != null) p.setStock(p.getStock() + oi.getQuantity());
            }
        }
        if (status == OrderStatus.DELIVERED && o.getPaymentMethod() == PaymentMethod.COD) {
            o.setPaymentStatus("PAID"); // cash collected on delivery
        }
        o.setStatus(status);
        return orderRepo.save(o);
    }
}

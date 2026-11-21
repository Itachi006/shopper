package com.shopeasy.controller;

import com.shopeasy.dto.Dtos.CheckoutRequest;
import com.shopeasy.model.Order;
import com.shopeasy.model.User;
import com.shopeasy.repository.OrderRepository;
import com.shopeasy.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService service;
    private final OrderRepository orders;

    public OrderController(OrderService service, OrderRepository orders) {
        this.service = service;
        this.orders = orders;
    }

    @PostMapping("/checkout")
    public Order checkout(@AuthenticationPrincipal User user, @Valid @RequestBody CheckoutRequest r) {
        return service.checkout(user, r);
    }

    @GetMapping
    public List<Order> mine(@AuthenticationPrincipal User user) {
        return orders.findByUserOrderByCreatedAtDesc(user);
    }

    @GetMapping("/{id}")
    public Order one(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.getOwned(user, id);
    }

    @PostMapping("/{id}/cancel")
    public Order cancel(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.cancelByCustomer(user, id);
    }
}

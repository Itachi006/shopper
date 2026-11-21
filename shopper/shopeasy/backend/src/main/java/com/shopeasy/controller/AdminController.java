package com.shopeasy.controller;

import com.shopeasy.dto.Dtos.*;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.*;
import com.shopeasy.repository.*;
import com.shopeasy.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Everything under /api/admin requires the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final OrderRepository orders;
    private final UserRepository users;
    private final OrderService orderService;

    public AdminController(ProductRepository products, CategoryRepository categories, OrderRepository orders,
                           UserRepository users, OrderService orderService) {
        this.products = products;
        this.categories = categories;
        this.orders = orders;
        this.users = users;
        this.orderService = orderService;
    }

    // ---------- dashboard ----------
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<Order> all = orders.findAll();
        BigDecimal revenue = all.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && "PAID".equals(o.getPaymentStatus()))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pending = all.stream()
                .filter(o -> o.getStatus() == OrderStatus.PLACED || o.getStatus() == OrderStatus.PAID).count();
        return Map.of(
                "products", products.findAll().stream().filter(Product::isActive).count(),
                "orders", all.size(),
                "customers", users.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER).size(),
                "pendingOrders", pending,
                "revenue", revenue);
    }

    // ---------- products ----------
    @GetMapping("/products")
    public List<Product> allProducts() {
        return products.findAllByOrderByIdDesc();
    }

    @PostMapping("/products")
    public Product createProduct(@Valid @RequestBody ProductRequest r) {
        return products.save(apply(new Product(), r));
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest r) {
        Product p = products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        return products.save(apply(p, r));
    }

    /** Soft delete: old orders still reference the product, so we just hide it from the shop. */
    @DeleteMapping("/products/{id}")
    public Map<String, String> deleteProduct(@PathVariable Long id) {
        Product p = products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        p.setActive(false);
        products.save(p);
        return Map.of("message", "Product removed from the shop");
    }

    private Product apply(Product p, ProductRequest r) {
        Category c = categories.findById(r.categoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found"));
        p.setName(r.name().trim());
        p.setDescription(r.description());
        p.setPrice(r.price());
        p.setMrp(r.mrp());
        p.setStock(r.stock());
        p.setImageUrl(r.imageUrl());
        p.setExtraImages(r.extraImages());
        p.setCategory(c);
        p.setFeatured(r.featured());
        p.setActive(r.active());
        return p;
    }

    // ---------- categories ----------
    @PostMapping("/categories")
    public Category createCategory(@Valid @RequestBody CategoryRequest r) {
        if (categories.existsByNameIgnoreCase(r.name().trim()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category already exists");
        return categories.save(new Category(r.name().trim(), r.description(), r.imageUrl()));
    }

    @DeleteMapping("/categories/{id}")
    public Map<String, String> deleteCategory(@PathVariable Long id) {
        if (products.existsByCategoryId(id))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot delete: this category still has products");
        categories.deleteById(id);
        return Map.of("message", "Category deleted");
    }

    // ---------- orders ----------
    @GetMapping("/orders")
    public List<Order> allOrders() {
        return orders.findAllByOrderByCreatedAtDesc();
    }

    @PutMapping("/orders/{id}/status")
    public Order updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest r) {
        return orderService.updateStatus(id, r.status());
    }

    // ---------- customers ----------
    @GetMapping("/customers")
    public List<User> customers() {
        return users.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER);
    }
}

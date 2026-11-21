package com.shopeasy.dto;

import com.shopeasy.model.OrderStatus;
import com.shopeasy.model.PaymentMethod;
import com.shopeasy.model.User;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class Dtos {

    public record RegisterRequest(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,
            String phone) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password) {}

    public record AuthResponse(String token, User user) {}

    public record CartRequest(@NotNull Long productId, @Min(1) int quantity) {}

    public record CheckoutRequest(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Phone is required") String phone,
            @NotBlank(message = "Address is required") String address,
            @NotBlank(message = "City is required") String city,
            @NotBlank(message = "Pincode is required") String pincode,
            @NotNull(message = "Choose a payment method") PaymentMethod paymentMethod) {}

    public record VerifyRequest(
            @NotNull Long orderId,
            String razorpayPaymentId,
            String razorpaySignature) {}

    public record StatusRequest(@NotNull OrderStatus status) {}

    public record ProductRequest(
            @NotBlank(message = "Product name is required") String name,
            String description,
            @NotNull(message = "Price is required") @DecimalMin(value = "0.0", message = "Price cannot be negative") BigDecimal price,
            BigDecimal mrp,
            @Min(value = 0, message = "Stock cannot be negative") int stock,
            String imageUrl,
            String extraImages,
            @NotNull(message = "Category is required") Long categoryId,
            boolean featured,
            boolean active) {}

    public record CategoryRequest(
            @NotBlank(message = "Category name is required") String name,
            String description,
            String imageUrl) {}
}

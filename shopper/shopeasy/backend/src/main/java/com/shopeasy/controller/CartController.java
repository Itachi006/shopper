package com.shopeasy.controller;

import com.shopeasy.dto.Dtos.CartRequest;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.CartItem;
import com.shopeasy.model.Product;
import com.shopeasy.model.User;
import com.shopeasy.repository.CartItemRepository;
import com.shopeasy.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartItemRepository cart;
    private final ProductRepository products;

    public CartController(CartItemRepository cart, ProductRepository products) {
        this.cart = cart;
        this.products = products;
    }

    @GetMapping
    public List<CartItem> get(@AuthenticationPrincipal User user) {
        return cart.findByUserOrderByIdAsc(user);
    }

    /** Add a product (or increase quantity if it is already in the cart). */
    @PostMapping
    @Transactional
    public List<CartItem> add(@AuthenticationPrincipal User user, @Valid @RequestBody CartRequest r) {
        Product p = products.findById(r.productId()).filter(Product::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        CartItem item = cart.findByUserAndProduct(user, p).orElseGet(() -> {
            CartItem c = new CartItem();
            c.setUser(user);
            c.setProduct(p);
            c.setQuantity(0);
            return c;
        });
        int newQty = item.getQuantity() + r.quantity();
        if (newQty > p.getStock()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only " + p.getStock() + " in stock");
        }
        item.setQuantity(newQty);
        cart.save(item);
        return cart.findByUserOrderByIdAsc(user);
    }

    /** Set an exact quantity. */
    @PutMapping("/{id}")
    @Transactional
    public List<CartItem> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestParam int quantity) {
        CartItem item = cart.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (quantity < 1) throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        if (quantity > item.getProduct().getStock()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only " + item.getProduct().getStock() + " in stock");
        }
        item.setQuantity(quantity);
        cart.save(item);
        return cart.findByUserOrderByIdAsc(user);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public List<CartItem> remove(@AuthenticationPrincipal User user, @PathVariable Long id) {
        cart.findByIdAndUser(id, user).ifPresent(cart::delete);
        return cart.findByUserOrderByIdAsc(user);
    }
}

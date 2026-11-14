package com.shopeasy.controller;

import com.shopeasy.config.JwtUtil;
import com.shopeasy.dto.Dtos.*;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.Role;
import com.shopeasy.model.User;
import com.shopeasy.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.BAD_REQUEST, "Email is already registered");
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(r.phone());
        u.setPassword(encoder.encode(r.password()));
        u.setRole(Role.CUSTOMER);
        users.save(u);
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u);
    }

    @GetMapping("/me")
    public User me(@AuthenticationPrincipal User user) {
        return user;
    }
}

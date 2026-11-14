package com.shopeasy.controller;

import com.shopeasy.exception.ApiException;
import com.shopeasy.model.Category;
import com.shopeasy.model.Product;
import com.shopeasy.repository.CategoryRepository;
import com.shopeasy.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Public (no login needed) endpoints: categories and products. */
@RestController
@RequestMapping("/api")
public class ProductController {
    private final ProductRepository products;
    private final CategoryRepository categories;

    public ProductController(ProductRepository products, CategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    @GetMapping("/categories")
    public List<Category> categories() {
        return categories.findAll();
    }

    @GetMapping("/products/featured")
    public List<Product> featured() {
        return products.findByFeaturedTrueAndActiveTrueOrderByIdDesc();
    }

    @GetMapping("/products/{id}")
    public Product one(@PathVariable Long id) {
        return products.findById(id).filter(Product::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @GetMapping("/products")
    public Page<Product> list(@RequestParam(required = false) String search,
                              @RequestParam(required = false) Long categoryId,
                              @RequestParam(required = false) BigDecimal minPrice,
                              @RequestParam(required = false) BigDecimal maxPrice,
                              @RequestParam(defaultValue = "newest") String sort,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "12") int size) {

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.isTrue(root.get("active")));
            if (search != null && !search.isBlank()) {
                ps.add(cb.like(cb.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            }
            if (categoryId != null) ps.add(cb.equal(root.get("category").get("id"), categoryId));
            if (minPrice != null) ps.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("price"), minPrice));
            if (maxPrice != null) ps.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("price"), maxPrice));
            return cb.and(ps.toArray(new Predicate[0]));
        };

        Sort s = switch (sort) {
            case "price_asc" -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            case "name" -> Sort.by("name").ascending();
            default -> Sort.by("id").descending();
        };
        int safeSize = Math.min(Math.max(size, 1), 48);
        return products.findAll(spec, PageRequest.of(Math.max(page, 0), safeSize, s));
    }
}

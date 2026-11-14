package com.shopeasy.repository;

import com.shopeasy.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByFeaturedTrueAndActiveTrueOrderByIdDesc();
    List<Product> findAllByOrderByIdDesc();
    boolean existsByCategoryId(Long categoryId);
}

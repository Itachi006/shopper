-- ShopEasy database schema (MySQL 8+)
-- Run this in MySQL Workbench, OR just start the backend (it auto-creates the same tables).
-- Sample categories/products and the admin user are inserted automatically by the backend on first run.

CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,            -- BCrypt hash
  phone       VARCHAR(20),
  role        VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',   -- CUSTOMER | ADMIN
  created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS categories (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  image_url   VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS products (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id   BIGINT NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  mrp           DECIMAL(10,2),                  -- original price (for discount display)
  stock         INT NOT NULL DEFAULT 0,
  image_url     VARCHAR(500),
  extra_images  VARCHAR(2000),                  -- comma separated extra image URLs
  featured      BIT NOT NULL DEFAULT 0,
  active        BIT NOT NULL DEFAULT 1,         -- soft delete flag
  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_name (name),
  INDEX idx_products_category (category_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  product_id  BIGINT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cart_user_product (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  shipping_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL,
  status              VARCHAR(30) NOT NULL,     -- PENDING_PAYMENT | PLACED | PAID | SHIPPED | DELIVERED | CANCELLED
  payment_method      VARCHAR(20) NOT NULL,     -- COD | ONLINE
  payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING | PAID | FAILED
  razorpay_order_id   VARCHAR(100),
  payment_id          VARCHAR(100),
  ship_name           VARCHAR(100) NOT NULL,
  ship_phone          VARCHAR(20)  NOT NULL,
  ship_address        VARCHAR(500) NOT NULL,
  ship_city           VARCHAR(100) NOT NULL,
  ship_pincode        VARCHAR(10)  NOT NULL,
  created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
);

CREATE TABLE IF NOT EXISTS order_items (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT NOT NULL,
  product_id    BIGINT NOT NULL,
  product_name  VARCHAR(200) NOT NULL,          -- snapshot at purchase time
  price         DECIMAL(10,2) NOT NULL,         -- snapshot at purchase time
  quantity      INT NOT NULL,
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id)
);

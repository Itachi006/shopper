package com.shopeasy.config;

import com.shopeasy.model.*;
import com.shopeasy.repository.CategoryRepository;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Runs on startup: creates the admin account and sample shop data if the database is empty. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, CategoryRepository categories, ProductRepository products, PasswordEncoder encoder) {
        this.users = users;
        this.categories = categories;
        this.products = products;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!users.existsByRole(Role.ADMIN)) {
            User a = new User();
            a.setName("Admin");
            a.setEmail("admin@shopeasy.com");
            a.setPassword(encoder.encode("Admin@123"));
            a.setRole(Role.ADMIN);
            users.save(a);
            System.out.println(">>> Admin created: admin@shopeasy.com / Admin@123  (change this!)");
        }

        if (categories.count() == 0) {
            Category elec = categories.save(new Category("Electronics", "Phones, audio and gadgets", img("electronics", 600, 400)));
            Category fash = categories.save(new Category("Fashion", "Clothing and accessories", img("fashion", 600, 400)));
            Category home = categories.save(new Category("Home & Kitchen", "Make your home better", img("home", 600, 400)));
            Category books = categories.save(new Category("Books", "Learn something new", img("books", 600, 400)));
            Category sports = categories.save(new Category("Sports", "Fitness and outdoor gear", img("sports", 600, 400)));

            add(elec, "Wireless Bluetooth Headphones", "Over-ear headphones with deep bass, 30-hour battery and a built-in microphone for calls.", "1999", "3499", 40, true);
            add(elec, "Smart Watch Series 5", "Fitness tracking, heart-rate monitor, sleep tracking and 7-day battery life.", "2999", "4999", 25, true);
            add(elec, "Portable Power Bank 20000mAh", "Fast-charging power bank with dual USB output. Charge two devices at once.", "1299", "1999", 60, false);
            add(elec, "Bluetooth Speaker", "Waterproof portable speaker with rich sound and 12-hour playtime.", "1499", "2499", 35, false);

            add(fash, "Men's Cotton T-Shirt", "Soft, breathable 100% cotton t-shirt. Regular fit, available for everyday wear.", "399", "799", 120, true);
            add(fash, "Women's Denim Jacket", "Classic denim jacket with a comfortable fit. Pairs with anything.", "1799", "2999", 30, false);
            add(fash, "Running Shoes", "Lightweight, cushioned running shoes with a durable grip sole.", "2199", "3999", 50, true);

            add(home, "Non-stick Cookware Set (3 pcs)", "Induction-friendly non-stick set: kadhai, fry pan and tawa.", "1599", "2799", 20, true);
            add(home, "Stainless Steel Water Bottle 1L", "Double-wall insulated bottle. Keeps drinks cold for 24 hours, hot for 12.", "549", "899", 80, false);
            add(home, "LED Desk Lamp", "Adjustable brightness, eye-care LED desk lamp with USB charging port.", "699", "1299", 45, false);

            add(books, "Java: The Complete Reference", "A complete guide to Java programming, from basics to advanced topics.", "799", "1199", 25, true);
            add(books, "Clean Code", "A handbook of agile software craftsmanship by Robert C. Martin.", "599", "999", 30, false);

            add(sports, "Yoga Mat 6mm", "Anti-slip, extra-thick yoga mat with carry strap.", "499", "999", 70, false);
            add(sports, "Adjustable Dumbbell Set (20 kg)", "Home gym dumbbell set with adjustable plates and a secure lock.", "2499", "3999", 15, false);
            add(sports, "Cricket Bat (Kashmir Willow)", "Full-size, well-balanced bat for tennis-ball and leather-ball practice.", "1199", "1999", 18, false);
            System.out.println(">>> Sample categories and products inserted");
        }
    }

    private void add(Category c, String name, String desc, String price, String mrp, int stock, boolean featured) {
        Product p = new Product();
        p.setCategory(c);
        p.setName(name);
        p.setDescription(desc);
        p.setPrice(new BigDecimal(price));
        p.setMrp(new BigDecimal(mrp));
        p.setStock(stock);
        p.setFeatured(featured);
        String seed = name.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        p.setImageUrl(img(seed, 600, 600));
        p.setExtraImages(img(seed + "-2", 600, 600) + "," + img(seed + "-3", 600, 600));
        products.save(p);
    }

    private static String img(String seed, int w, int h) {
        return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
    }
}

# ShopEasy: Full-Stack E-commerce (Spring Boot + React + MySQL)

**Live demo: https://itachi006.github.io/shopper/**

| Role | Login |
|---|---|
| Customer | `demo@shopeasy.com` / `Demo@123` (or sign up) |
| Admin | `admin@shopeasy.com` / `Admin@123` |

The live site is the real React frontend running against an **in-browser demo API**
(`shopeasy/frontend/src/demo/mockServer.js`) that reproduces the Spring Boot endpoints and business rules
(stock checks, free shipping above ₹999, order and payment flow, admin panel). Data is stored in your browser's
localStorage, and the footer banner has a "Reset demo" button. GitHub Pages only hosts static files, which is why
the demo does not call the Java server. The full Java + MySQL stack is in this repo and runs locally (below).

**Features:** product search, filters and sorting, product details, JWT login/register, cart, checkout (COD or online
payment with Razorpay or demo mode), order tracking and cancellation, admin dashboard (products, categories, orders, customers).

**Deployment:** every push to `main` runs `.github/workflows/deploy.yml`, which builds the frontend with `VITE_DEMO=true`
and publishes it to GitHub Pages.

```
shopeasy/
  database/schema.sql      <- full MySQL structure (6 tables)
  backend/                 <- Spring Boot 3 REST API (Java 17+)
  frontend/                <- React 18 + Vite
```

## 1. Install (all free)
JDK 17 or 21 · Maven (or use IntelliJ's built-in) · MySQL 8 · Node.js LTS

## 2. Database
Option A (easiest): do nothing. The backend creates the database and tables on first start.
Option B: open `database/schema.sql` in MySQL Workbench and run it.

## 3. Backend
Edit `backend/src/main/resources/application.properties`, set your MySQL password
(or set the environment variable `DB_PASSWORD`).
```
cd backend
mvn spring-boot:run
```
Runs on http://localhost:8080. On first start it automatically creates:
- Admin login: **admin@shopeasy.com / Admin@123** (change it!)
- 5 categories and 15 sample products

## 4. Frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## 5. Payments
- Default is **DEMO mode** (no keys): "Pay online" shows a confirm box, then the full
  create -> verify -> mark PAID flow runs on the server. Good for development.
- Real Razorpay (test mode): create a free account, copy the TEST key id/secret into
  `application.properties` (`razorpay.key-id`, `razorpay.key-secret`) or set env vars
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Test card: 4111 1111 1111 1111, any future date, any CVV.
  The server verifies the HMAC-SHA256 signature before marking an order paid.

## API overview
| Area | Endpoints |
|---|---|
| Auth | POST /api/auth/register, POST /api/auth/login, GET /api/auth/me |
| Catalog (public) | GET /api/categories, GET /api/products?search&categoryId&minPrice&maxPrice&sort&page&size, GET /api/products/featured, GET /api/products/{id} |
| Cart | GET/POST /api/cart, PUT/DELETE /api/cart/{id} |
| Orders | POST /api/orders/checkout, GET /api/orders, GET /api/orders/{id}, POST /api/orders/{id}/cancel |
| Payments | POST /api/payments/create/{orderId}, POST /api/payments/verify |
| Admin (ADMIN role) | /api/admin/stats, products CRUD, categories, orders + status update, customers |

## How it works
- Passwords are BCrypt-hashed; login returns a JWT; React sends it as `Authorization: Bearer ...`.
- Checkout copies cart -> order in one transaction, checks and reduces stock, stores price snapshots,
  and clears the cart. Cancelling puts the stock back.
- Order flow: ONLINE = PENDING_PAYMENT -> PAID -> SHIPPED -> DELIVERED; COD = PLACED -> SHIPPED -> DELIVERED.
- Free shipping above ₹999, otherwise ₹50 (see `OrderService`).

## Ideas to extend (good for your portfolio)
Refresh tokens, image upload, product reviews, wishlist, email on order, Docker, unit tests with JUnit, deploy
(Render/Railway for backend, Vercel/Netlify for frontend, free MySQL on Aiven/TiDB).

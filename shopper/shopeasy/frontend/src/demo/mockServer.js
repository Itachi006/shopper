// In-browser mock of the ShopEasy REST API.
//
// GitHub Pages can only serve static files, so the live demo cannot talk to the Spring Boot backend.
// This module re-implements the same endpoints (same URLs, same JSON shapes, same business rules as
// the Java services) on top of localStorage. It is plugged into axios as a custom adapter in api.js,
// so none of the React pages need to know whether they are talking to the real server or to this demo.
//
// Enabled when VITE_API_URL is not set (see api.js). Set VITE_API_URL to use the real backend.

import { AxiosError } from 'axios';

const DB_KEY = 'shopeasy_demo_db_v1';
const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 50;

const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------- seed data (mirrors DataSeeder.java)
function seed() {
  const cats = [
    ['Electronics', 'Phones, audio and gadgets', 'electronics'],
    ['Fashion', 'Clothing and accessories', 'fashion'],
    ['Home & Kitchen', 'Make your home better', 'home'],
    ['Books', 'Learn something new', 'books'],
    ['Sports', 'Fitness and outdoor gear', 'sports'],
  ].map(([name, description, s], i) => ({ id: i + 1, name, description, imageUrl: img(s, 600, 400) }));

  const rows = [
    [1, 'Wireless Bluetooth Headphones', 'Over-ear headphones with deep bass, 30-hour battery and a built-in microphone for calls.', 1999, 3499, 40, true],
    [1, 'Smart Watch Series 5', 'Fitness tracking, heart-rate monitor, sleep tracking and 7-day battery life.', 2999, 4999, 25, true],
    [1, 'Portable Power Bank 20000mAh', 'Fast-charging power bank with dual USB output. Charge two devices at once.', 1299, 1999, 60, false],
    [1, 'Bluetooth Speaker', 'Waterproof portable speaker with rich sound and 12-hour playtime.', 1499, 2499, 35, false],
    [2, "Men's Cotton T-Shirt", 'Soft, breathable 100% cotton t-shirt. Regular fit, available for everyday wear.', 399, 799, 120, true],
    [2, "Women's Denim Jacket", 'Classic denim jacket with a comfortable fit. Pairs with anything.', 1799, 2999, 30, false],
    [2, 'Running Shoes', 'Lightweight, cushioned running shoes with a durable grip sole.', 2199, 3999, 50, true],
    [3, 'Non-stick Cookware Set (3 pcs)', 'Induction-friendly non-stick set: kadhai, fry pan and tawa.', 1599, 2799, 20, true],
    [3, 'Stainless Steel Water Bottle 1L', 'Double-wall insulated bottle. Keeps drinks cold for 24 hours, hot for 12.', 549, 899, 80, false],
    [3, 'LED Desk Lamp', 'Adjustable brightness, eye-care LED desk lamp with USB charging port.', 699, 1299, 45, false],
    [4, 'Java: The Complete Reference', 'A complete guide to Java programming, from basics to advanced topics.', 799, 1199, 25, true],
    [4, 'Clean Code', 'A handbook of agile software craftsmanship by Robert C. Martin.', 599, 999, 30, false],
    [5, 'Yoga Mat 6mm', 'Anti-slip, extra-thick yoga mat with carry strap.', 499, 999, 70, false],
    [5, 'Adjustable Dumbbell Set (20 kg)', 'Home gym dumbbell set with adjustable plates and a secure lock.', 2499, 3999, 15, false],
    [5, 'Cricket Bat (Kashmir Willow)', 'Full-size, well-balanced bat for tennis-ball and leather-ball practice.', 1199, 1999, 18, false],
  ];

  const products = rows.map(([categoryId, name, description, price, mrp, stock, featured], i) => {
    const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      id: i + 1,
      name,
      description,
      price,
      mrp,
      stock,
      imageUrl: img(s, 600, 600),
      extraImages: `${img(s + '-2', 600, 600)},${img(s + '-3', 600, 600)}`,
      featured,
      active: true,
      category: cats.find((c) => c.id === categoryId),
      createdAt: nowIso(),
    };
  });

  return {
    seq: { user: 3, product: products.length + 1, category: cats.length + 1, cart: 1, order: 1, orderItem: 1 },
    users: [
      { id: 1, name: 'Admin', email: 'admin@shopeasy.com', phone: null, role: 'ADMIN', createdAt: nowIso(), _pw: 'Admin@123' },
      { id: 2, name: 'Demo Customer', email: 'demo@shopeasy.com', phone: '9876543210', role: 'CUSTOMER', createdAt: nowIso(), _pw: 'Demo@123' },
    ],
    categories: cats,
    products,
    cart: [], // { id, userId, productId, quantity }
    orders: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage blocked or corrupted: fall through to a fresh DB */
  }
  return seed();
}

let db = load();
const save = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* private mode / quota: the demo still works for this page view */
  }
};

// ---------------------------------------------------------------- helpers
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (m) => new HttpError(400, m);
const notFound = (m) => new HttpError(404, m);

const publicUser = ({ _pw, ...u }) => u;
const clone = (x) => JSON.parse(JSON.stringify(x));
const productById = (id) => db.products.find((p) => p.id === Number(id));

function currentUser(config) {
  const auth = config.headers?.Authorization || config.headers?.get?.('Authorization') || '';
  const m = /^Bearer demo-(\d+)$/.exec(auth);
  const u = m && db.users.find((x) => x.id === Number(m[1]));
  if (!u) throw new HttpError(401, 'Please log in');
  return u;
}
const requireAdmin = (u) => {
  if (u.role !== 'ADMIN') throw new HttpError(403, 'Access denied');
};

const cartFor = (u) =>
  db.cart
    .filter((c) => c.userId === u.id)
    .sort((a, b) => a.id - b.id)
    .map((c) => ({ id: c.id, quantity: c.quantity, product: clone(productById(c.productId)) }));

const orderView = (o) => ({ ...clone({ ...o, userId: undefined }), user: publicUser(db.users.find((u) => u.id === o.userId)) });

function need(body, fields) {
  for (const [key, label] of fields) {
    if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '') throw bad(label);
  }
}

// ---------------------------------------------------------------- order logic (mirrors OrderService.java)
function changeStatus(o, status) {
  if (o.status === 'CANCELLED') throw bad('A cancelled order cannot be changed');
  if (status === 'CANCELLED') {
    for (const it of o.items) {
      const p = productById(it.product.id);
      if (p) p.stock += it.quantity;
    }
  }
  if (status === 'DELIVERED' && o.paymentMethod === 'COD') o.paymentStatus = 'PAID';
  o.status = status;
  return o;
}

// ---------------------------------------------------------------- route table
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, re, keys, handler });
};

// ---- auth
route('post', '/auth/register', ({ body }) => {
  need(body, [['name', 'Name is required'], ['email', 'Email is required'], ['password', 'Password is required']]);
  if (!/^\S+@\S+\.\S+$/.test(body.email)) throw bad('Invalid email');
  if (String(body.password).length < 6) throw bad('Password must be at least 6 characters');
  const email = body.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) throw bad('Email is already registered');
  const u = { id: db.seq.user++, name: body.name.trim(), email, phone: body.phone || null, role: 'CUSTOMER', createdAt: nowIso(), _pw: body.password };
  db.users.push(u);
  return { token: `demo-${u.id}`, user: publicUser(u) };
});

route('post', '/auth/login', ({ body }) => {
  need(body, [['email', 'Email is required'], ['password', 'Password is required']]);
  const u = db.users.find((x) => x.email === body.email.trim().toLowerCase() && x._pw === body.password);
  if (!u) throw new HttpError(401, 'Invalid email or password');
  return { token: `demo-${u.id}`, user: publicUser(u) };
});

route('get', '/auth/me', ({ user }) => publicUser(user));

// ---- catalog (public)
route('get', '/categories', () => clone(db.categories));

route('get', '/products/featured', () =>
  clone(db.products.filter((p) => p.featured && p.active).sort((a, b) => b.id - a.id)));

route('get', '/products/:id', ({ args }) => {
  const p = productById(args.id);
  if (!p || !p.active) throw notFound('Product not found');
  return clone(p);
});

route('get', '/products', ({ params }) => {
  const { search, categoryId, minPrice, maxPrice, sort = 'newest' } = params;
  const page = Math.max(Number(params.page) || 0, 0);
  const size = Math.min(Math.max(Number(params.size) || 12, 1), 48);

  let list = db.products.filter((p) => p.active);
  if (search && String(search).trim()) list = list.filter((p) => p.name.toLowerCase().includes(String(search).trim().toLowerCase()));
  if (categoryId) list = list.filter((p) => p.category.id === Number(categoryId));
  if (minPrice !== undefined && minPrice !== '') list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice !== undefined && maxPrice !== '') list = list.filter((p) => p.price <= Number(maxPrice));

  const sorters = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    newest: (a, b) => b.id - a.id,
  };
  list = [...list].sort(sorters[sort] || sorters.newest);

  return {
    content: clone(list.slice(page * size, page * size + size)),
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
    number: page,
    size,
  };
});

// ---- cart
route('get', '/cart', ({ user }) => cartFor(user));

route('post', '/cart', ({ user, body }) => {
  const p = productById(body.productId);
  if (!p || !p.active) throw notFound('Product not found');
  const qty = Number(body.quantity);
  if (!(qty >= 1)) throw bad('Quantity must be at least 1');
  let item = db.cart.find((c) => c.userId === user.id && c.productId === p.id);
  const newQty = (item ? item.quantity : 0) + qty;
  if (newQty > p.stock) throw bad(`Only ${p.stock} in stock`);
  if (item) item.quantity = newQty;
  else db.cart.push({ id: db.seq.cart++, userId: user.id, productId: p.id, quantity: newQty });
  return cartFor(user);
});

route('put', '/cart/:id', ({ user, args, params }) => {
  const item = db.cart.find((c) => c.id === Number(args.id) && c.userId === user.id);
  if (!item) throw notFound('Cart item not found');
  const quantity = Number(params.quantity);
  if (!(quantity >= 1)) throw bad('Quantity must be at least 1');
  const stock = productById(item.productId).stock;
  if (quantity > stock) throw bad(`Only ${stock} in stock`);
  item.quantity = quantity;
  return cartFor(user);
});

route('delete', '/cart/:id', ({ user, args }) => {
  db.cart = db.cart.filter((c) => !(c.id === Number(args.id) && c.userId === user.id));
  return cartFor(user);
});

// ---- orders
route('post', '/orders/checkout', ({ user, body }) => {
  need(body, [
    ['name', 'Name is required'], ['phone', 'Phone is required'], ['address', 'Address is required'],
    ['city', 'City is required'], ['pincode', 'Pincode is required'], ['paymentMethod', 'Choose a payment method'],
  ]);
  const cart = db.cart.filter((c) => c.userId === user.id);
  if (cart.length === 0) throw bad('Your cart is empty');

  let subtotal = 0;
  const items = [];
  for (const ci of cart) {
    const p = productById(ci.productId);
    if (!p || !p.active || p.stock < ci.quantity) {
      throw bad(`Not enough stock for "${p ? p.name : 'a product'}" (available: ${p ? p.stock : 0})`);
    }
  }
  for (const ci of cart) {
    const p = productById(ci.productId);
    p.stock -= ci.quantity;
    items.push({ id: db.seq.orderItem++, product: clone(p), productName: p.name, price: p.price, quantity: ci.quantity });
    subtotal += p.price * ci.quantity;
  }
  const shippingFee = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const order = {
    id: db.seq.order++,
    userId: user.id,
    subtotal,
    shippingFee,
    totalAmount: subtotal + shippingFee,
    status: body.paymentMethod === 'COD' ? 'PLACED' : 'PENDING_PAYMENT',
    paymentMethod: body.paymentMethod,
    paymentStatus: 'PENDING',
    razorpayOrderId: null,
    paymentId: null,
    shipName: body.name.trim(),
    shipPhone: body.phone.trim(),
    shipAddress: body.address.trim(),
    shipCity: body.city.trim(),
    shipPincode: body.pincode.trim(),
    createdAt: nowIso(),
    items,
  };
  db.orders.push(order);
  db.cart = db.cart.filter((c) => c.userId !== user.id);
  return orderView(order);
});

const ownedOrder = (user, id) => {
  const o = db.orders.find((x) => x.id === Number(id) && x.userId === user.id);
  if (!o) throw notFound('Order not found');
  return o;
};

route('get', '/orders', ({ user }) =>
  db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.id - a.id).map(orderView));

route('get', '/orders/:id', ({ user, args }) => orderView(ownedOrder(user, args.id)));

route('post', '/orders/:id/cancel', ({ user, args }) => {
  const o = ownedOrder(user, args.id);
  if (o.status !== 'PLACED' && o.status !== 'PENDING_PAYMENT') throw bad('This order can no longer be cancelled');
  return orderView(changeStatus(o, 'CANCELLED'));
});

// ---- payments (always DEMO mode: the browser shows a confirm box, no real gateway)
route('post', '/payments/create/:orderId', ({ user, args }) => {
  const o = ownedOrder(user, args.orderId);
  if (o.paymentMethod !== 'ONLINE' || o.status !== 'PENDING_PAYMENT') throw bad('This order does not need an online payment');
  return { orderId: o.id, amount: Math.round(o.totalAmount * 100), currency: 'INR', demo: true };
});

route('post', '/payments/verify', ({ user, body }) => {
  const o = ownedOrder(user, body.orderId);
  if (o.status !== 'PENDING_PAYMENT') throw bad('This order is not awaiting payment');
  o.paymentId = `DEMO-${Date.now()}`;
  o.paymentStatus = 'PAID';
  o.status = 'PAID';
  return orderView(o);
});

// ---- admin
route('get', '/admin/stats', ({ user }) => {
  requireAdmin(user);
  const revenue = db.orders
    .filter((o) => o.status !== 'CANCELLED' && o.paymentStatus === 'PAID')
    .reduce((s, o) => s + o.totalAmount, 0);
  return {
    products: db.products.filter((p) => p.active).length,
    orders: db.orders.length,
    customers: db.users.filter((u) => u.role === 'CUSTOMER').length,
    pendingOrders: db.orders.filter((o) => o.status === 'PLACED' || o.status === 'PAID').length,
    revenue,
  };
});

route('get', '/admin/products', ({ user }) => {
  requireAdmin(user);
  return clone([...db.products].sort((a, b) => b.id - a.id));
});

function applyProduct(p, r) {
  need(r, [['name', 'Product name is required'], ['price', 'Price is required'], ['categoryId', 'Category is required']]);
  if (Number(r.price) < 0) throw bad('Price cannot be negative');
  if (Number(r.stock || 0) < 0) throw bad('Stock cannot be negative');
  const c = db.categories.find((x) => x.id === Number(r.categoryId));
  if (!c) throw bad('Category not found');
  Object.assign(p, {
    name: r.name.trim(),
    description: r.description ?? '',
    price: Number(r.price),
    mrp: r.mrp === '' || r.mrp == null ? null : Number(r.mrp),
    stock: Number(r.stock || 0),
    imageUrl: r.imageUrl || null,
    extraImages: r.extraImages || null,
    category: clone(c),
    featured: !!r.featured,
    active: r.active === undefined ? true : !!r.active,
  });
  return p;
}

route('post', '/admin/products', ({ user, body }) => {
  requireAdmin(user);
  const p = applyProduct({ id: db.seq.product++, createdAt: nowIso() }, body);
  db.products.push(p);
  return clone(p);
});

route('put', '/admin/products/:id', ({ user, args, body }) => {
  requireAdmin(user);
  const p = productById(args.id);
  if (!p) throw notFound('Product not found');
  return clone(applyProduct(p, body));
});

route('delete', '/admin/products/:id', ({ user, args }) => {
  requireAdmin(user);
  const p = productById(args.id);
  if (!p) throw notFound('Product not found');
  p.active = false;
  return { message: 'Product removed from the shop' };
});

route('post', '/admin/categories', ({ user, body }) => {
  requireAdmin(user);
  need(body, [['name', 'Category name is required']]);
  const name = body.name.trim();
  if (db.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw bad('Category already exists');
  const c = { id: db.seq.category++, name, description: body.description || '', imageUrl: body.imageUrl || '' };
  db.categories.push(c);
  return clone(c);
});

route('delete', '/admin/categories/:id', ({ user, args }) => {
  requireAdmin(user);
  const id = Number(args.id);
  if (db.products.some((p) => p.category.id === id)) throw bad('Cannot delete: this category still has products');
  db.categories = db.categories.filter((c) => c.id !== id);
  return { message: 'Category deleted' };
});

route('get', '/admin/orders', ({ user }) => {
  requireAdmin(user);
  return [...db.orders].sort((a, b) => b.id - a.id).map(orderView);
});

route('put', '/admin/orders/:id/status', ({ user, args, body }) => {
  requireAdmin(user);
  const o = db.orders.find((x) => x.id === Number(args.id));
  if (!o) throw notFound('Order not found');
  const valid = ['PENDING_PAYMENT', 'PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!valid.includes(body.status)) throw bad('Invalid status');
  return orderView(changeStatus(o, body.status));
});

route('get', '/admin/customers', ({ user }) => {
  requireAdmin(user);
  return db.users.filter((u) => u.role === 'CUSTOMER').sort((a, b) => b.id - a.id).map(publicUser);
});

// ---------------------------------------------------------------- axios adapter
const PUBLIC = new Set(['/auth/register', '/auth/login', '/categories', '/products', '/products/featured']);

function dispatch(config) {
  const method = (config.method || 'get').toLowerCase();
  const [pathRaw, query = ''] = String(config.url).split('?');
  const path = pathRaw.replace(/\/+$/, '') || '/';

  const params = { ...Object.fromEntries(new URLSearchParams(query)), ...(config.params || {}) };
  let body = {};
  if (config.data) {
    try { body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data; } catch { body = {}; }
  }

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.re.exec(path);
    if (!m) continue;
    const args = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const isPublic = PUBLIC.has(path) || /^\/products\/\d+$/.test(path);
    const user = isPublic ? null : currentUser(config);
    const out = r.handler({ args, params, body, user });
    save();
    return out;
  }
  throw notFound(`No such endpoint: ${method.toUpperCase()} ${path}`);
}

export function demoAdapter(config) {
  return new Promise((resolve, reject) => {
    // a tiny delay so loading states are visible, like a real network call
    setTimeout(() => {
      try {
        const data = dispatch(config);
        resolve({ data, status: 200, statusText: 'OK', headers: {}, config, request: {} });
      } catch (e) {
        const status = e instanceof HttpError ? e.status : 500;
        const message = e instanceof HttpError ? e.message : 'Something went wrong';
        if (!(e instanceof HttpError)) console.error(e);
        const response = { data: { message, status }, status, statusText: message, headers: {}, config, request: {} };
        reject(new AxiosError(message, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, response));
      }
    }, 120);
  });
}

/** Wipes the demo database (used by the "Reset demo" link). */
export function resetDemo() {
  try { localStorage.removeItem(DB_KEY); } catch { /* ignore */ }
  db = seed();
  save();
}

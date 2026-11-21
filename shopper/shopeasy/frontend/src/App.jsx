import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Admin from './pages/admin/Admin.jsx';
import { DEMO } from './api.js';
import { resetDemo } from './demo/mockServer.js';

export default function App() {
  return (
    <>
      {DEMO && (
        <div className="demo-banner">
          <b>Live demo</b> · runs fully in your browser (data saved locally) ·
          Customer: <code>demo@shopeasy.com / Demo@123</code> · Admin: <code>admin@shopeasy.com / Admin@123</code> ·{' '}
          <button className="link-btn" onClick={() => { resetDemo(); localStorage.removeItem('token'); window.location.hash = '#/'; window.location.reload(); }}>Reset demo</button>
        </div>
      )}
      <Navbar />
      <main className="container page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
          <Route path="*" element={<div className="empty"><h2>404 - Page not found</h2><Link to="/" className="btn">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} ShopEasy · Demo e-commerce project</div>
      </footer>
    </>
  );
}

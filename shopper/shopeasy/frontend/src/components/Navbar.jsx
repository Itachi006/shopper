import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const search = (e) => {
    e.preventDefault();
    nav(`/products?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo">Shop<span>Easy</span></Link>
        <form className="nav-search" onSubmit={search}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
          <button type="submit">Search</button>
        </form>
        <nav className="nav-links">
          <Link to="/products">Products</Link>
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <span className="hello">Hi, {user.name.split(' ')[0]}</span>
              <button className="link-btn" onClick={() => { logout(); nav('/'); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-sm">Sign up</Link>
            </>
          )}
          <Link to="/cart" className="cart-link">🛒 Cart{count > 0 && <b className="badge">{count}</b>}</Link>
        </nav>
      </div>
    </header>
  );
}

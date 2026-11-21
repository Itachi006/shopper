import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errMsg, money } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export const shippingFor = (subtotal) => (subtotal >= 999 || subtotal === 0 ? 0 : 50);

export default function Cart() {
  const { items, subtotal, update, remove } = useCart();
  const nav = useNavigate();
  const [error, setError] = useState('');

  const run = async (fn) => {
    setError('');
    try { await fn(); } catch (e) { setError(errMsg(e)); }
  };

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <Link to="/products" className="btn">Continue shopping</Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);

  return (
    <>
      <h1>Shopping cart</h1>
      {error && <p className="alert error">{error}</p>}
      <div className="cart-layout">
        <div>
          {items.map((i) => (
            <div key={i.id} className="cart-row card">
              <img src={i.product.imageUrl} alt="" />
              <div className="grow">
                <Link to={`/products/${i.product.id}`}><strong>{i.product.name}</strong></Link>
                <div className="muted">{money(i.product.price)} each</div>
                <button className="link-btn danger" onClick={() => run(() => remove(i.id))}>Remove</button>
              </div>
              <div className="qty">
                <button disabled={i.quantity <= 1} onClick={() => run(() => update(i.id, i.quantity - 1))}>−</button>
                <span>{i.quantity}</span>
                <button onClick={() => run(() => update(i.id, i.quantity + 1))}>+</button>
              </div>
              <strong className="line-total">{money(i.quantity * i.product.price)}</strong>
            </div>
          ))}
        </div>
        <aside className="summary card">
          <h3>Order summary</h3>
          <div className="sum-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sum-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : money(shipping)}</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
          {shipping > 0 && <small className="muted">Add {money(999 - subtotal)} more for free shipping</small>}
          <button className="btn" onClick={() => nav('/checkout')}>Proceed to checkout</button>
        </aside>
      </div>
    </>
  );
}

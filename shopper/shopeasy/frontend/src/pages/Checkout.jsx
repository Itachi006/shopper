import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { payForOrder } from '../utils/pay.js';
import { shippingFor } from './Cart.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '', city: '', pincode: '', paymentMethod: 'ONLINE' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { refresh(); }, [refresh]);

  if (items.length === 0 && !busy) {
    return <div className="empty"><h2>Nothing to checkout</h2><Link to="/products" className="btn">Shop now</Link></div>;
  }

  const shipping = shippingFor(subtotal);

  const placeOrder = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    let order;
    try {
      order = (await api.post('/orders/checkout', form)).data;
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
      return;
    }
    await refresh();
    if (order.paymentMethod === 'ONLINE') {
      try {
        await payForOrder(order, user);
      } catch (err) {
        // order exists but is unpaid: the customer can retry from the order page
        nav(`/orders/${order.id}`, { replace: true, state: { notice: 'Payment not completed. You can pay now from this page.' } });
        return;
      }
    }
    nav(`/orders/${order.id}`, { replace: true, state: { notice: 'Thank you! Your order has been placed 🎉' } });
  };

  return (
    <>
      <h1>Checkout</h1>
      <form className="cart-layout" onSubmit={placeOrder}>
        <div className="card pad">
          <h3>Delivery address</h3>
          {error && <p className="alert error">{error}</p>}
          <label>Full name</label><input required value={form.name} onChange={set('name')} />
          <label>Phone</label><input required value={form.phone} onChange={set('phone')} />
          <label>Address</label><textarea required rows={3} value={form.address} onChange={set('address')} />
          <div className="row">
            <div className="grow"><label>City</label><input required value={form.city} onChange={set('city')} /></div>
            <div className="grow"><label>Pincode</label><input required pattern="[0-9]{6}" title="6 digit pincode" value={form.pincode} onChange={set('pincode')} /></div>
          </div>

          <h3>Payment method</h3>
          <label className="radio"><input type="radio" name="pm" checked={form.paymentMethod === 'ONLINE'} onChange={() => setForm({ ...form, paymentMethod: 'ONLINE' })} /> Pay online (UPI / Card / Netbanking)</label>
          <label className="radio"><input type="radio" name="pm" checked={form.paymentMethod === 'COD'} onChange={() => setForm({ ...form, paymentMethod: 'COD' })} /> Cash on delivery</label>
        </div>

        <aside className="summary card">
          <h3>Order summary</h3>
          {items.map((i) => (
            <div key={i.id} className="sum-row"><span>{i.product.name} × {i.quantity}</span><span>{money(i.quantity * i.product.price)}</span></div>
          ))}
          <hr />
          <div className="sum-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sum-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : money(shipping)}</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
          <button className="btn" disabled={busy}>
            {busy ? 'Processing...' : form.paymentMethod === 'ONLINE' ? 'Place order & pay' : 'Place order'}
          </button>
        </aside>
      </form>
    </>
  );
}

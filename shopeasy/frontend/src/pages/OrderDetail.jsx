import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { payForOrder } from '../utils/pay.js';
import { statusLabel } from './Orders.jsx';

const STEPS = ['Order placed', 'Shipped', 'Delivered'];
const stepIndex = { PLACED: 0, PAID: 0, SHIPPED: 1, DELIVERED: 2 };

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const loc = useLocation();
  const [o, setO] = useState(null);
  const [notice, setNotice] = useState(loc.state?.notice || '');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setO(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <p className="alert error">{error}</p>;
  if (!o) return <p>Loading...</p>;

  const pay = async () => {
    setError(''); setNotice('');
    try { setO(await payForOrder(o, user)); setNotice('Payment successful ✓'); }
    catch (e) { setError(e.message === 'Payment cancelled' ? 'Payment cancelled' : errMsg(e)); }
  };
  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try { setO((await api.post(`/orders/${o.id}/cancel`)).data); setNotice('Order cancelled'); }
    catch (e) { setError(errMsg(e)); }
  };

  const cancelled = o.status === 'CANCELLED';
  const current = stepIndex[o.status] ?? -1;

  return (
    <>
      <p><Link to="/orders">← All orders</Link></p>
      <h1>Order #{o.id} <span className={`status ${o.status}`}>{statusLabel[o.status]}</span></h1>
      {notice && <p className="alert success">{notice}</p>}
      {error && <p className="alert error">{error}</p>}

      {!cancelled && o.status !== 'PENDING_PAYMENT' && (
        <div className="timeline card">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i <= current ? 'done' : ''}`}><div className="dot">{i <= current ? '✓' : i + 1}</div><span>{s}</span></div>
          ))}
        </div>
      )}
      {o.status === 'PENDING_PAYMENT' && (
        <div className="card pad"><p>Your order is waiting for payment.</p><button className="btn" onClick={pay}>Pay {money(o.totalAmount)} now</button></div>
      )}

      <div className="cart-layout">
        <div>
          {o.items.map((i) => (
            <div key={i.id} className="cart-row card">
              <img src={i.product.imageUrl} alt="" />
              <div className="grow"><Link to={`/products/${i.product.id}`}><strong>{i.productName}</strong></Link>
                <div className="muted">{money(i.price)} × {i.quantity}</div></div>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
        </div>
        <aside>
          <div className="summary card">
            <h3>Payment</h3>
            <div className="sum-row"><span>Method</span><span>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</span></div>
            <div className="sum-row"><span>Status</span><span>{o.paymentStatus}</span></div>
            {o.paymentId && <div className="sum-row"><span>Payment ID</span><small>{o.paymentId}</small></div>}
            <hr />
            <div className="sum-row"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
            <div className="sum-row"><span>Shipping</span><span>{Number(o.shippingFee) === 0 ? 'FREE' : money(o.shippingFee)}</span></div>
            <div className="sum-row total"><span>Total</span><span>{money(o.totalAmount)}</span></div>
          </div>
          <div className="summary card">
            <h3>Delivery address</h3>
            <p>{o.shipName}<br />{o.shipAddress}<br />{o.shipCity} - {o.shipPincode}<br />📞 {o.shipPhone}</p>
          </div>
          {(o.status === 'PLACED' || o.status === 'PENDING_PAYMENT') && <button className="btn btn-danger" onClick={cancel}>Cancel order</button>}
        </aside>
      </div>
    </>
  );
}

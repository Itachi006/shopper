import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { money } from '../api.js';

export const statusLabel = {
  PENDING_PAYMENT: 'Payment pending', PLACED: 'Order placed', PAID: 'Paid', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export default function Orders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get('/orders').then((r) => setOrders(r.data)); }, []);

  if (!orders) return <p>Loading...</p>;
  if (orders.length === 0) return <div className="empty"><h2>No orders yet</h2><Link to="/products" className="btn">Start shopping</Link></div>;

  return (
    <>
      <h1>My orders</h1>
      {orders.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="card order-row">
          <div>
            <strong>Order #{o.id}</strong>
            <div className="muted">{new Date(o.createdAt).toLocaleString('en-IN')} · {o.items.length} item(s)</div>
            <div className="muted">{o.items.map((i) => i.productName).join(', ')}</div>
          </div>
          <div className="right">
            <strong>{money(o.totalAmount)}</strong>
            <span className={`status ${o.status}`}>{statusLabel[o.status]}</span>
          </div>
        </Link>
      ))}
    </>
  );
}

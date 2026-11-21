import { Fragment, useEffect, useState, useCallback } from 'react';
import api, { errMsg, money } from '../../api.js';
import { statusLabel } from '../Orders.jsx';

const TABS = ['Dashboard', 'Products', 'Categories', 'Orders', 'Customers'];
const NEXT_STATUSES = ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Admin() {
  const [tab, setTab] = useState('Dashboard');
  return (
    <>
      <h1>Admin panel</h1>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Dashboard' && <Dashboard />}
      {tab === 'Products' && <ProductsAdmin />}
      {tab === 'Categories' && <CategoriesAdmin />}
      {tab === 'Orders' && <OrdersAdmin />}
      {tab === 'Customers' && <CustomersAdmin />}
    </>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p>Loading...</p>;
  const tiles = [
    ['Revenue (paid)', money(s.revenue)], ['Orders', s.orders], ['Orders to process', s.pendingOrders],
    ['Products', s.products], ['Customers', s.customers],
  ];
  return <div className="stats">{tiles.map(([l, v]) => <div key={l} className="card stat"><small className="muted">{l}</small><strong>{v}</strong></div>)}</div>;
}

const emptyProduct = { name: '', description: '', price: '', mrp: '', stock: 0, imageUrl: '', extraImages: '', categoryId: '', featured: false, active: true };

function ProductsAdmin() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(null); // null = closed, otherwise product form
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get('/admin/products').then((r) => setList(r.data));
    api.get('/categories').then((r) => setCats(r.data));
  }, []);
  useEffect(load, [load]);

  const open = (p) => {
    setError('');
    setEditId(p ? p.id : null);
    setForm(p ? { ...p, categoryId: p.category?.id, mrp: p.mrp ?? '', extraImages: p.extraImages ?? '', imageUrl: p.imageUrl ?? '', description: p.description ?? '' }
              : { ...emptyProduct, categoryId: cats[0]?.id || '' });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form, price: Number(form.price), mrp: form.mrp === '' ? null : Number(form.mrp), stock: Number(form.stock), categoryId: Number(form.categoryId) };
    try {
      if (editId) await api.put(`/admin/products/${editId}`, body); else await api.post('/admin/products', body);
      setForm(null); load();
    } catch (err) { setError(errMsg(err)); }
  };
  const del = async (p) => {
    if (!window.confirm(`Remove "${p.name}" from the shop?`)) return;
    await api.delete(`/admin/products/${p.id}`); load();
  };

  return (
    <>
      <div className="toolbar"><span className="muted">{list.length} products</span><button className="btn btn-sm" onClick={() => open(null)}>+ Add product</button></div>

      {form && (
        <form className="card pad admin-form" onSubmit={save}>
          <h3>{editId ? 'Edit product' : 'New product'}</h3>
          {error && <p className="alert error">{error}</p>}
          <label>Name</label><input required value={form.name} onChange={set('name')} />
          <label>Description</label><textarea rows={3} value={form.description} onChange={set('description')} />
          <div className="row">
            <div className="grow"><label>Price (₹)</label><input type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} /></div>
            <div className="grow"><label>MRP (₹, optional)</label><input type="number" step="0.01" min="0" value={form.mrp} onChange={set('mrp')} /></div>
            <div className="grow"><label>Stock</label><input type="number" min="0" required value={form.stock} onChange={set('stock')} /></div>
          </div>
          <label>Category</label>
          <select required value={form.categoryId} onChange={set('categoryId')}>
            <option value="" disabled>Select...</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label>Main image URL</label><input value={form.imageUrl} onChange={set('imageUrl')} />
          <label>Extra image URLs (comma separated)</label><input value={form.extraImages} onChange={set('extraImages')} />
          <label className="radio"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured on home page</label>
          <label className="radio"><input type="checkbox" checked={form.active} onChange={set('active')} /> Visible in shop</label>
          <div className="row"><button className="btn btn-sm">Save</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}

      <div className="table-wrap"><table>
        <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id} className={p.active ? '' : 'faded'}>
            <td><img className="thumb" src={p.imageUrl} alt="" /></td>
            <td>{p.name}{p.featured && ' ⭐'}</td><td>{p.category?.name}</td><td>{money(p.price)}</td><td>{p.stock}</td>
            <td>{p.active ? 'Active' : 'Hidden'}</td>
            <td className="actions"><button className="link-btn" onClick={() => open(p)}>Edit</button>{p.active && <button className="link-btn danger" onClick={() => del(p)}>Remove</button>}</td>
          </tr>))}
        </tbody></table></div>
    </>
  );
}

function CategoriesAdmin() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '' });
  const [error, setError] = useState('');
  const load = useCallback(() => api.get('/categories').then((r) => setList(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/admin/categories', form); setForm({ name: '', description: '', imageUrl: '' }); load(); }
    catch (err) { setError(errMsg(err)); }
  };
  const del = async (c) => {
    setError('');
    try { await api.delete(`/admin/categories/${c.id}`); load(); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      {error && <p className="alert error">{error}</p>}
      <form className="card pad row" onSubmit={add}>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="btn btn-sm">Add category</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Description</th><th></th></tr></thead>
        <tbody>{list.map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.description}</td><td className="actions"><button className="link-btn danger" onClick={() => del(c)}>Delete</button></td></tr>)}</tbody>
      </table></div>
    </>
  );
}

function OrdersAdmin() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api.get('/admin/orders').then((r) => setList(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const change = async (o, status) => {
    setError('');
    try { await api.put(`/admin/orders/${o.id}/status`, { status }); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <>
      {error && <p className="alert error">{error}</p>}
      <div className="table-wrap"><table>
        <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>{list.map((o) => (
          <Fragment key={o.id}>
            <tr>
              <td><button className="link-btn" onClick={() => setOpen(open === o.id ? null : o.id)}>#{o.id}</button></td>
              <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              <td>{o.user.name}<br /><small className="muted">{o.user.email}</small></td>
              <td>{money(o.totalAmount)}</td>
              <td>{o.paymentMethod} · {o.paymentStatus}</td>
              <td><span className={`status ${o.status}`}>{statusLabel[o.status]}</span></td>
              <td>
                {o.status === 'CANCELLED' || o.status === 'PENDING_PAYMENT' ? '—' : (
                  <select value={o.status} onChange={(e) => change(o, e.target.value)}>
                    {NEXT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>)}
              </td>
            </tr>
            {open === o.id && (
              <tr><td colSpan={7} className="detail-row">
                {o.items.map((i) => <div key={i.id}>{i.productName} × {i.quantity} — {money(i.price * i.quantity)}</div>)}
                <div className="muted">Ship to: {o.shipName}, {o.shipAddress}, {o.shipCity} - {o.shipPincode} · 📞 {o.shipPhone}</div>
              </td></tr>
            )}
          </Fragment>))}
        </tbody></table></div>
    </>
  );
}

function CustomersAdmin() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/admin/customers').then((r) => setList(r.data)); }, []);
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
      <tbody>{list.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td><td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody>
    </table></div>
  );
}

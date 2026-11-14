import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await register(form);
      nav('/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <form className="auth card" onSubmit={submit}>
      <h2>Create account</h2>
      {error && <p className="alert error">{error}</p>}
      <label>Full name</label>
      <input required value={form.name} onChange={set('name')} />
      <label>Email</label>
      <input type="email" required value={form.email} onChange={set('email')} />
      <label>Phone</label>
      <input value={form.phone} onChange={set('phone')} />
      <label>Password (min 6 characters)</label>
      <input type="password" required minLength={6} value={form.password} onChange={set('password')} />
      <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Sign up'}</button>
      <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}

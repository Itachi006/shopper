import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products/featured')])
      .then(([c, f]) => { setCats(c.data); setFeatured(f.data); })
      .catch(() => setError('Cannot reach the server. Make sure the backend is running on port 8080.'));
  }, []);

  return (
    <>
      <section className="banner">
        <div>
          <h1>Big savings on everything you love</h1>
          <p>Electronics, fashion, home essentials and more. Free shipping on orders above ₹999.</p>
          <Link to="/products" className="btn btn-light">Shop now</Link>
        </div>
      </section>

      {error && <p className="alert error">{error}</p>}

      <h2 className="section-title">Shop by category</h2>
      <div className="cat-grid">
        {cats.map((c) => (
          <Link key={c.id} to={`/products?categoryId=${c.id}`} className="cat-card" style={{ backgroundImage: `url(${c.imageUrl})` }}>
            <span>{c.name}</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Featured products</h2>
      <div className="grid">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}

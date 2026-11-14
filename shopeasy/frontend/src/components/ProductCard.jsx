import { Link } from 'react-router-dom';
import { money } from '../api.js';

export const discount = (p) =>
  p.mrp && Number(p.mrp) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.mrp)) * 100) : 0;

export default function ProductCard({ p }) {
  const off = discount(p);
  return (
    <Link to={`/products/${p.id}`} className="card product-card">
      <div className="img-wrap">
        <img src={p.imageUrl} alt={p.name} loading="lazy" />
        {off > 0 && <span className="tag">{off}% OFF</span>}
        {p.stock === 0 && <span className="tag out">Out of stock</span>}
      </div>
      <div className="card-body">
        <small className="muted">{p.category?.name}</small>
        <h3>{p.name}</h3>
        <div className="price">
          <strong>{money(p.price)}</strong>
          {off > 0 && <s className="muted">{money(p.mrp)}</s>}
        </div>
      </div>
    </Link>
  );
}

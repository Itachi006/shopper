import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { discount } from '../components/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [p, setP] = useState(null);
  const [img, setImg] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((r) => { setP(r.data); setImg(r.data.imageUrl); setQty(1); })
      .catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
  }, [id]);

  if (!p) return msg.text ? <p className="alert error">{msg.text}</p> : <p>Loading...</p>;

  const images = [p.imageUrl, ...(p.extraImages ? p.extraImages.split(',') : [])].filter(Boolean);
  const off = discount(p);

  const addToCart = async (goToCart) => {
    if (!user) return nav('/login', { state: { from: `/products/${p.id}` } });
    try {
      await add(p.id, qty);
      if (goToCart) nav('/cart');
      else setMsg({ type: 'success', text: 'Added to cart ✓' });
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  return (
    <div className="detail">
      <div>
        <img className="main-img" src={img} alt={p.name} />
        <div className="thumbs">
          {images.map((u) => (
            <img key={u} src={u} alt="" className={u === img ? 'active' : ''} onClick={() => setImg(u)} />
          ))}
        </div>
      </div>
      <div>
        <p className="muted"><Link to="/products">Products</Link> / <Link to={`/products?categoryId=${p.category?.id}`}>{p.category?.name}</Link></p>
        <h1>{p.name}</h1>
        <div className="price big">
          <strong>{money(p.price)}</strong>
          {off > 0 && <><s className="muted">{money(p.mrp)}</s><span className="off">{off}% off</span></>}
        </div>
        <p className={p.stock > 0 ? 'in-stock' : 'out-stock'}>
          {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left!` : 'In stock'}
        </p>
        <p className="desc">{p.description}</p>

        {p.stock > 0 && (
          <>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</button>
            </div>
            <div className="row">
              <button className="btn" onClick={() => addToCart(false)}>Add to cart</button>
              <button className="btn btn-dark" onClick={() => addToCart(true)}>Buy now</button>
            </div>
          </>
        )}
        {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

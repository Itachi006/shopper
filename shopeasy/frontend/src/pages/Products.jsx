import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');

  const search = params.get('search') || '';
  const categoryId = params.get('categoryId') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const page = Number(params.get('page') || 0);

  useEffect(() => { api.get('/categories').then((r) => setCats(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: { search, categoryId, sort, minPrice, maxPrice, page, size: 12 } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [search, categoryId, sort, minPrice, maxPrice, page]);

  const set = (patch) => {
    const next = Object.fromEntries(params.entries());
    Object.entries({ page: 0, ...patch }).forEach(([k, v]) => (v === '' || v === null ? delete next[k] : (next[k] = v)));
    setParams(next);
  };

  return (
    <div className="shop-layout">
      <aside className="filters card">
        <h3>Filters</h3>
        <label>Category</label>
        <select value={categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Price range (₹)</label>
        <div className="row">
          <input type="number" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} />
          <input type="number" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <button className="btn btn-sm" onClick={() => set({ minPrice: min, maxPrice: max })}>Apply</button>
        <button className="link-btn" onClick={() => { setMin(''); setMax(''); setParams({}); }}>Clear all</button>
      </aside>

      <section>
        <div className="toolbar">
          <span className="muted">
            {data.totalElements} product{data.totalElements !== 1 && 's'}
            {search && <> for “{search}”</>}
          </span>
          <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {loading ? <p>Loading...</p> : data.content.length === 0 ? (
          <div className="empty"><h3>No products found</h3><p className="muted">Try a different search or filter.</p></div>
        ) : (
          <div className="grid">{data.content.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}

        {data.totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-sm" disabled={page === 0} onClick={() => set({ page: page - 1 })}>‹ Prev</button>
            <span>Page {page + 1} of {data.totalPages}</span>
            <button className="btn btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => set({ page: page + 1 })}>Next ›</button>
          </div>
        )}
      </section>
    </div>
  );
}

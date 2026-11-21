import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) return setItems([]);
    try {
      setItems((await api.get('/cart')).data);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else setItems([]);
  }, [user, refresh]);

  const add = async (productId, quantity = 1) => setItems((await api.post('/cart', { productId, quantity })).data);
  const update = async (id, quantity) => setItems((await api.put(`/cart/${id}?quantity=${quantity}`)).data);
  const remove = async (id) => setItems((await api.delete(`/cart/${id}`)).data);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.product.price), 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, update, remove, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

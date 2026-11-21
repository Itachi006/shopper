import axios from 'axios';
import { demoAdapter } from './demo/mockServer.js';

// DEMO mode (used for the GitHub Pages deployment): no backend needed, everything runs in the browser.
// Normal development / production with the Spring Boot API: leave VITE_DEMO unset.
export const DEMO = import.meta.env.VITE_DEMO === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  ...(DEMO ? { adapter: demoAdapter } : {}),
});

// attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// nice error message helper
export const errMsg = (e) =>
  e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong');

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default api;

import axios from 'axios';
import supabase from './supabase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Adjunta el token fresco en cada petición
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Si el servidor responde 401, intenta refrescar el token y reintentar UNA vez
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Solo reintenta en 401 y si no lo hemos reintentado ya
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          // Refresh falló — redirige a login
          window.location.href = '/login';
          return Promise.reject(err);
        }
        // Reintenta con el nuevo token
        original.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(original);
      } catch {
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default api;

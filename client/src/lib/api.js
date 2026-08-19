import axios from 'axios';
import supabase from './supabase';

const api = axios.create({
  // En dev: '/api' va por el proxy (setupProxy.js → localhost:8000)
  // En producción: REACT_APP_API_URL apunta a Railway, ej. https://yuuban-api.railway.app/api
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Agrega el token de Supabase en cada petición autenticada
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;

import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim();
export const API_BASE_URL = rawUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawUrl.replace(/\/+$/, '')
  : `${rawUrl.replace(/\/+$/, '')}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('hospital_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request - session expired or invalid');
    }
    return Promise.reject(error);
  }
);

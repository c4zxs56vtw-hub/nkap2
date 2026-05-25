// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Remplace par l'IP de ton serveur de développement Django (ex: http://192.168.1.X:8000/api)
const API_BASE_URL = 'https://api.nkap-app.com/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter automatiquement le Token JWT dans les requêtes
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
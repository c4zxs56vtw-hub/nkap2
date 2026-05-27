// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import Constants from 'expo-constants';

// Détermine dynamiquement l'URL de base du backend
const getBaseUrl = () => {
  if (!__DEV__) {
    return 'https://api.nkap-app.com/api';
  }

  // hostUri contient l'adresse IP de l'hôte (ex: 192.168.X.X:8081)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api`;
  }

  // Valeur par défaut si non détecté (par ex. sur le web)
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getBaseUrl();

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
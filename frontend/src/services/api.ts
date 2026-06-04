// services/api.ts
import axios from 'axios';
import { secureStore as SecureStore } from '../utils/secureStore';

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
    // Ne pas ajouter le token d'autorisation pour la connexion et l'inscription, ou les réglages publics
    const isPublicRequest = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/register') ||
      config.url.includes('/settings/public')
    );

    if (!isPublicRequest) {
      const token = await SecureStore.getItemAsync('user_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et vider le stockage si le jeton est expiré/invalide (401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Nettoyer les informations d'authentification expirées/invalides
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_status');
      await SecureStore.deleteItemAsync('user_full_name');
      await SecureStore.deleteItemAsync('kyc_identity_document_uri');
    }
    return Promise.reject(error);
  }
);

export default api;
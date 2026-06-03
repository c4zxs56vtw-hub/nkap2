// services/authService.ts
import api from './api';
import { secureStore as SecureStore } from '../utils/secureStore';

const formatError = (error: any, defaultMsg: string): string => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object') {
      if (data.detail) {
        return String(data.detail);
      }
      const messages = Object.entries(data).map(([field, errs]) => {
        const label = field === 'phone_number' ? 'Téléphone' : field === 'pin' ? 'PIN' : field === 'full_name' ? 'Nom' : field;
        const detail = Array.isArray(errs) ? errs.join(', ') : String(errs);
        return `${label} : ${detail}`;
      });
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
  }
  return error.message || defaultMsg;
};

export const authService = {
  /**
   * Envoie l'adresse e-mail et le mot de passe au backend Django
   */
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', {
        email: email,
        password: password,
      });

      // Si Django renvoie un token valide (ex: access token JWT)
      if (response.data.token) {
        await SecureStore.setItemAsync('user_token', response.data.token);
        // Optionnel : Sauvegarder le statut KYC (PENDING, VERIFIED) localement
        await SecureStore.setItemAsync('user_status', response.data.status);
        if (response.data.user?.full_name) {
          await SecureStore.setItemAsync('user_full_name', response.data.user.full_name);
        }
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(formatError(error, "Identifiants invalides ou erreur serveur"));
    }
  },

  /**
   * Crée un nouveau compte utilisateur
   */
  register: async (fullName: string, phone: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register/', {
        full_name: fullName,
        phone_number: phone,
        email: email,
        password: password,
      });

      if (response.data.token) {
        await SecureStore.setItemAsync('user_token', response.data.token);
        await SecureStore.setItemAsync('user_status', response.data.status);
        if (response.data.user?.full_name) {
          await SecureStore.setItemAsync('user_full_name', response.data.user.full_name);
        }
      }

      return response.data;
    } catch (error: any) {
      throw new Error(formatError(error, "Impossible de créer le compte"));
    }
  },

  /**
   * Soumet le dossier KYC complet
   */
  submitKyc: async (identityDocumentUri: string, fullName: string, mobileMoneyNumber: string) => {
    try {
      const formData = new FormData();
      const filename = identityDocumentUri.split('/').pop() || 'cni_document.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('identity_document', {
        uri: identityDocumentUri,
        name: filename,
        type,
      } as any);
      formData.append('full_name', fullName);
      formData.append('mobile_money_number', mobileMoneyNumber);

      const response = await api.post('/auth/submit-kyc/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status) {
        await SecureStore.setItemAsync('user_status', response.data.status);
      }

      return response.data;
    } catch (error: any) {
      const serverMessage = error.response?.data?.detail || "Impossible d'envoyer votre dossier KYC";
      throw new Error(serverMessage);
    }
  },

  /**
   * Déconnexion complète et nettoyage des clés de sécurité
   */
  logout: async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_status');
    await SecureStore.deleteItemAsync('user_full_name');
    await SecureStore.deleteItemAsync('kyc_identity_document_uri');
  }
};

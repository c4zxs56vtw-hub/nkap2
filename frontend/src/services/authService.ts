// services/authService.ts
import api from './api';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  /**
   * Envoie le numéro et le code PIN au backend Django
   */
  login: async (phone: string, pin: string) => {
    try {
      const response = await api.post('/auth/login/', {
        phone_number: phone,
        pin: pin,
      });

      // Si Django renvoie un token valide (ex: access token JWT)
      if (response.data.token) {
        await SecureStore.setItemAsync('user_token', response.data.token);
        // Optionnel : Sauvegarder le statut KYC (PENDING, VERIFIED) localement
        await SecureStore.setItemAsync('user_status', response.data.status);
      }
      
      return response.data;
    } catch (error: any) {
      const serverMessage = error.response?.data?.detail || "Identifiants invalides ou erreur serveur";
      throw new Error(serverMessage);
    }
  },

  /**
   * Crée un nouveau compte utilisateur
   */
  register: async (fullName: string, phone: string, pin: string) => {
    try {
      const response = await api.post('/auth/register/', {
        full_name: fullName,
        phone_number: phone,
        pin: pin,
      });

      if (response.data.token) {
        await SecureStore.setItemAsync('user_token', response.data.token);
        await SecureStore.setItemAsync('user_status', response.data.status);
      }

      return response.data;
    } catch (error: any) {
      const serverMessage = error.response?.data?.detail || "Impossible de créer le compte";
      throw new Error(serverMessage);
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
    await SecureStore.deleteItemAsync('kyc_identity_document_uri');
  }
};

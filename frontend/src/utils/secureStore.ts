import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const SESSION_TTL = 12 * 60 * 60 * 1000; // 12 heures en millisecondes

// Clés d'authentification et d'identification considérées comme sensibles
const SENSITIVE_KEYS = ['user_token', 'user_status', 'user_full_name', 'user_role'];

export const secureStore = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        if (SENSITIVE_KEYS.includes(key)) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && 'expiry' in parsed) {
              if (Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
              }
              return parsed.value;
            }
          } catch {
            // En cas d'erreur de parsing (ex: ancien format brut), on retourne la valeur brute
            return raw;
          }
        }
        return raw;
      } catch {
        return null;
      }
    }
    try {
      return await ExpoSecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      try {
        if (SENSITIVE_KEYS.includes(key)) {
          const item = {
            value: value,
            expiry: Date.now() + SESSION_TTL
          };
          localStorage.setItem(key, JSON.stringify(item));
        } else {
          localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }
    try {
      await ExpoSecureStore.setItemAsync(key, value);
    } catch {}
  },

  deleteItemAsync: async (key: string): Promise<void> => {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await ExpoSecureStore.deleteItemAsync(key);
    } catch {}
  }
};

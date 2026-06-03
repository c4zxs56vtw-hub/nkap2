import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const secureStore = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
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
        localStorage.setItem(key, value);
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

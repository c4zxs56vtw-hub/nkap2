import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { 
  useColorScheme, 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Vérifie le statut de maintenance de la plateforme
  const checkMaintenance = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await api.get('/settings/public');
      if (response.data) {
        setIsMaintenance(!!response.data.is_maintenance_mode);
        setMaintenanceMessage(response.data.maintenance_message || "L'application est actuellement en cours de maintenance. Veuillez réessayer plus tard.");
      }
    } catch (err) {
      console.warn('Failed to check maintenance mode status:', err);
      // En cas de problème de réseau, on laisse passer pour éviter de bloquer l'utilisateur hors-ligne
      setIsMaintenance(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkMaintenance();
  }, []);

  // Écran de chargement d'initialisation (évite un flash de l'écran de login)
  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" />
          <ActivityIndicator size="large" color="#00B574" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Écran de Mode Maintenance Premium si activé côté web admin
  if (isMaintenance) {
    return (
      <SafeAreaProvider>
        <View style={styles.maintenanceContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.contentCard}>
            <View style={styles.iconWrapper}>
              <Ionicons name="construct-outline" size={40} color="#00B574" />
            </View>
            <Text style={styles.title}>Mode Maintenance</Text>
            <Text style={styles.message}>{maintenanceMessage}</Text>
            
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => checkMaintenance(true)}
              disabled={refreshing}
              activeOpacity={0.8}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nkap • Sécurité & Transparence</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="transfers" />
          <Stack.Screen name="scan-qr" />
          <Stack.Screen name="join-tontine" />
          <Stack.Screen name="join/[id]" />
          <Stack.Screen name="tontine-invite-qr" />
          <Stack.Screen name="create-tontine" />
          <Stack.Screen name="create-tontine-step-2" />
          <Stack.Screen name="create-tontine-step-3" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/kyc" />
          <Stack.Screen name="auth/kyc-step-2" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/kyc-pending" />
          <Stack.Screen name="explorer-tontines" />
          <Stack.Screen name="tontine-messages" />
          <Stack.Screen name="tontine-chat" />
          <Stack.Screen name="admin-chat" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentCard: {
    backgroundColor: '#131b2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 181, 116, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 181, 116, 0.2)',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#00B574',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#00B574',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});


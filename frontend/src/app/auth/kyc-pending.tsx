import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/use-responsive';
import { secureStore as SecureStore } from '../../utils/secureStore';
import api from '../../services/api';

export default function KycPendingScreen() {
  const router = useRouter();
  const { isWeb, contentMaxWidth } = useResponsive();

  const checkKycStatus = async () => {
    try {
      const response = await api.get('/auth/me/');
        const status = String(response.data.kyc_status ?? '').toUpperCase();
        await SecureStore.setItemAsync('user_status', status);
        if (status === 'VERIFIED') {
          router.replace('/dashboard' as never);
        } else if (status === 'REJECTED') {
          router.replace('/auth/kyc' as never);
        }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Initial check
    checkKycStatus();
    // Poll every 4 seconds in the background
    const interval = setInterval(checkKycStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {isWeb && (
        <View style={styles.webTopBar}>
          <Text style={styles.webBrand}>Nkap</Text>
        </View>
      )}

      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <View
          style={[
            styles.card,
            isWeb && styles.cardWeb,
            isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
          ]}
        >
          {/* Icône */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="clock-outline" size={56} color="#00687a" />
          </View>

          <Text style={styles.title}>Vérification en cours</Text>
          <Text style={styles.subtitle}>
            Votre compte est en attente de validation. Vous pourrez accéder au tableau de bord
            dès que le statut passera à VERIFIED.
          </Text>

          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="shield-half-full" size={16} color="#b4136d" />
            <Text style={styles.statusText}>STATUT : EN ATTENTE</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.primaryButtonText}>Retour à la connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/dashboard' as never)}
          >
            <Text style={styles.secondaryButtonText}>Accéder à l&apos;accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  webTopBar: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  webBrand: {
    color: '#00687a',
    fontSize: 22,
    fontWeight: '800',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerWeb: {
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
  },
  cardWeb: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    padding: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0f7f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#1C1F22',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 28,
  },
  statusText: {
    color: '#b4136d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#00B574',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#1C1F22',
    fontSize: 16,
    fontWeight: '700',
  },
});

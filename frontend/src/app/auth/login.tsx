import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { useResponsive } from '../../hooks/use-responsive';

export default function LoginScreen() {
  const router = useRouter();
  const { isWeb, contentMaxWidth } = useResponsive();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !pin) {
      Alert.alert('Champs requis', 'Veuillez remplir votre numéro de téléphone et votre code PIN.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(phone, pin);
      const status = String(data?.status ?? '').toUpperCase();
      if (status === 'VERIFIED') {
        router.replace('/dashboard' as never);
      } else if (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'SUBMITTED') {
        router.replace('/auth/kyc-pending' as never);
      } else {
        router.replace('/auth/kyc' as never);
      }
    } catch (error: any) {
      Alert.alert('Échec de connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barre top web */}
      {isWeb && (
        <View style={styles.webTopBar}>
          <Text style={styles.webBrand}>Nkap</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.scrollContentWeb,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              isWeb && styles.cardWeb,
              isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
            ]}
          >
            {/* Logo centré DANS la carte */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Bienvenue sur Nkap</Text>
              <Text style={styles.subtitle}>
                Gérez vos finances avec simplicité et sécurité.
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              {/* Téléphone */}
              <View style={styles.field}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="06 00 00 00 00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* PIN */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Code PIN</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Mot de passe oublié', 'Redirection en cours...')
                    }
                  >
                    <Text style={styles.forgotLink}>Oublié ?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.pinInput}
                    placeholder="••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={4}
                    value={pin}
                    onChangeText={setPin}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPin((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPin ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bouton connexion */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonLoading]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {/* Lien inscription */}
              <View style={styles.registerRow}>
                <Text style={styles.helperText}>Nouveau sur Nkap ? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register' as never)}>
                  <Text style={styles.registerLink}>Créer un compte</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Biométrie */}
            <TouchableOpacity
              style={styles.biometrics}
              onPress={() =>
                Alert.alert('Biométrie', "Analyse de l'empreinte digitale en cours...")
              }
            >
              <Ionicons name="finger-print-outline" size={34} color="#C4C9D4" />
              <Text style={styles.biometricsText}>Utiliser l'empreinte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  flex: { flex: 1 },

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
    fontSize: 20,
    fontWeight: '800',
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#EEF2F7',
    justifyContent: 'center',
  },
  scrollContentWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    minHeight: '100%',
  },

  /* Carte principale */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 24,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardWeb: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    paddingHorizontal: 44,
    paddingTop: 52,
    paddingBottom: 44,
    width: '100%',
    maxWidth: 460,
  },

  /* Logo */
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 20,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  /* Formulaire */
  form: {
    gap: 18,
  },
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  forgotLink: {
    color: '#E91E63',
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F3F6FA',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    height: '100%',
  },
  pinInput: {
    flex: 1,
    color: '#111827',
    fontSize: 18,
    letterSpacing: 6,
    height: '100%',
  },

  /* Bouton */
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#00B574',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#00B574',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonLoading: {
    backgroundColor: '#34D399',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* Lien inscription */
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Biométrie */
  biometrics: {
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
  },
  biometricsText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

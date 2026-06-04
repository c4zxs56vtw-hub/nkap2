import React, { useState, useEffect } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { useResponsive } from '../../hooks/use-responsive';
import { secureStore as SecureStore } from '../../utils/secureStore';
import api from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { isWeb, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const checkAutoLogin = async () => {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        if (!token) {
          if (active) setLoading(false);
          return;
        }

        // Configuration d'un timeout de 2 secondes max pour la vérification automatique
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await api.get('/auth/me/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (active && response.data) {
          const status = String(response.data.kyc_status ?? '').toUpperCase();
          await SecureStore.setItemAsync('user_status', status);
          const hasUploadedDoc = !!response.data.identity_document;
          if (status === 'VERIFIED') {
            router.replace('/dashboard' as never);
          } else if (hasUploadedDoc && (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'SUBMITTED')) {
            router.replace('/auth/kyc-pending' as never);
          } else {
            router.replace('/auth/kyc' as never);
          }
        }
      } catch (err) {
        console.log('[AutoLogin] Connexion automatique ignorée ou expirée (timeout)');
        if (active) setLoading(false);
      }
    };

    // Déterminer s'il faut afficher le chargement initial uniquement si un jeton est présent
    SecureStore.getItemAsync('user_token').then((token) => {
      if (token && active) {
        setLoading(true);
        checkAutoLogin();
      } else {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const showAlert = (title: string, message: string) => {
    console.log(`[Alert] ${title}: ${message}`);
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    console.log('[Login] Clicked login button');
    console.log('[Login] Current values:', { email, passwordLength: password.length });

    if (!email || !password) {
      showAlert('Champs requis', 'Veuillez remplir votre adresse e-mail et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      console.log('[Login] Sending API request to login...');
      const data = await authService.login(email, password);
      console.log('[Login] API Response received:', data);

      const status = String(data?.status ?? '').toUpperCase();
      const hasUploadedDoc = !!data?.user?.identity_document;
      
      console.log('[Login] Redirecting based on status:', { status, hasUploadedDoc });
      if (status === 'VERIFIED') {
        router.replace('/dashboard' as never);
      } else if (hasUploadedDoc && (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'SUBMITTED')) {
        router.replace('/auth/kyc-pending' as never);
      } else {
        router.replace('/auth/kyc' as never);
      }
    } catch (error: any) {
      console.error('[Login] Error during login:', error);
      showAlert('Échec de connexion', error.message);
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
                Gerez vos finances avec simplicite et securite.
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              {/* Adresse e-mail */}
              <View style={styles.field}>
                <Text style={styles.label}>Adresse e-mail</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="exemple@domaine.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Mot de passe */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <TouchableOpacity
                    onPress={() =>
                      showAlert('Mot de passe oublié', 'Redirection en cours...')
                    }
                  >
                    <Text style={styles.forgotLink}>Oublie ?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
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
                showAlert('Biométrie', "Analyse de la reconnaissance faciale (Face ID) en cours...")
              }
            >
              <MaterialCommunityIcons name="face-recognition" size={34} color="#C4C9D4" />
              <Text style={styles.biometricsText}>Utiliser Face ID</Text>
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

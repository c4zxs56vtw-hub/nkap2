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

export default function RegisterScreen() {
  const router = useRouter();
  const { isWeb, contentMaxWidth } = useResponsive();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !phone || !email || !password || !confirmPassword) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }
    if (fullName.trim().length < 2) {
      Alert.alert('Nom invalide', 'Veuillez saisir votre nom complet.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('E-mail invalide', 'Veuillez saisir une adresse e-mail valide.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Mot de passe invalide', 'Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur de confirmation', 'Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register(fullName.trim(), phone, email, password);
      const status = String(data?.status ?? '').toUpperCase();
      const hasUploadedDoc = !!data?.user?.identity_document;
      if (status === 'VERIFIED') {
        router.replace('/dashboard' as never);
      } else if (hasUploadedDoc && (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'SUBMITTED')) {
        router.replace('/auth/kyc-pending' as never);
      } else {
        router.replace('/auth/kyc' as never);
      }
    } catch (error: any) {
      Alert.alert('Échec de création du compte', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            {/* Logo */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>
                Ouvrez votre compte Nkap en quelques secondes avec votre adresse e-mail, téléphone
                et un mot de passe sécurisé.
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom complet"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
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

              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
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

              <View style={styles.field}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              <Text style={styles.note}>
                Le mot de passe doit comporter au moins 4 caractères. Il servira à vous connecter à l&apos;application.
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonLoading]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Créer mon compte</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.helperText}>Vous avez déjà un compte ? </Text>
                <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </View>
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

  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 18,
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
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  form: {
    gap: 16,
  },
  field: {
    gap: 7,
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
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
  note: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#00B574',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '800',
  },
});

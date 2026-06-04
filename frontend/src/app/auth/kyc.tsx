import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { secureStore as SecureStore } from '../../utils/secureStore';
import { useResponsive } from '../../hooks/use-responsive';
import api from '../../services/api';

export default function KycScreen() {
  const router = useRouter();
  const { isWeb, contentMaxWidth, hPad } = useResponsive();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me/');
        if (response.data) {
          const status = String(response.data.kyc_status ?? '').toUpperCase();
          if (status === 'REJECTED' && response.data.kyc_rejection_reason) {
            setRejectionReason(response.data.kyc_rejection_reason);
          }
        }
      } catch (err) {
        console.error('[KycScreen] Impossible de charger le motif de rejet', err);
      }
    };
    loadProfile();
  }, []);

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 10],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          setImageUri(result.assets[0].uri);
        }
        return;
      }

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', "Nkap a besoin d'accéder à votre appareil photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la caméra ou la galerie.");
    }
  };

  const handleContinue = async () => {
    if (!imageUri) {
      Alert.alert('Document manquant', 'Veuillez capturer ou sélectionner votre CNI.');
      return;
    }
    setProcessing(true);
    try {
      await SecureStore.setItemAsync('kyc_identity_document_uri', imageUri);
      router.replace('/auth/kyc-step-2' as never);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer votre document.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isWeb && (
        <View style={styles.webTopBar}>
          <Text style={styles.webBrand}>Nkap</Text>
          <View style={styles.webStepBadge}>
            <Text style={styles.webStepText}>Étape 2 / 3</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.scrollContentWeb,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.page,
            isWeb && styles.pageWeb,
            isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
            { paddingHorizontal: isWeb ? 40 : hPad },
          ]}
        >
          {/* Header progress — mobile only */}
          {!isWeb && (
            <View style={styles.headerBlock}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Vérification d'identité</Text>
                <Text style={styles.stepText}>Étape 2/3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          )}

          {/* Header web */}
          {isWeb && (
            <View style={styles.webHeader}>
              <Text style={styles.title}>Vérification d'identité</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          )}

          <Text style={styles.description}>
            Soumettez vos documents officiels pour sécuriser votre compte conformément aux
            réglementations de la zone CEMAC.
          </Text>

          {rejectionReason && (
            <View style={styles.rejectionBanner}>
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text style={styles.rejectionText}>
                <Text style={styles.rejectionTitle}>Dossier rejeté : </Text>
                {rejectionReason}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.uploadCard, isWeb && styles.uploadCardWeb]}
            onPress={pickImage}
            disabled={processing}
          >
            {imageUri ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.previewImage, isWeb && styles.previewImageWeb]}
                  resizeMode="cover"
                />
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#006c49" />
                  <Text style={styles.successText}>Image sélectionnée avec succès</Text>
                </View>
                <Text style={styles.smallHint}>Cliquez pour reprendre la photo</Text>
              </View>
            ) : (
              <View style={styles.placeholderWrap}>
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={32} color="#006c49" />
                </View>
                <Text style={styles.placeholderTitle}>
                  Prenez une photo nette du Recto et du Verso de votre CNI
                </Text>
                <Text style={styles.placeholderSubtitle}>Formats acceptés : JPG, PNG (Max 5MB)</Text>
                {Platform.OS === 'web' && (
                  <Text style={styles.webHint}>Sur le web, choisissez une image depuis vos fichiers.</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#EC4899" />
            <Text style={styles.warningText}>
              Le nom écrit sur Nkap doit correspondre exactement au nom de votre compte Mobile
              Money pour valider vos futures transactions automatiques.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, processing && styles.primaryButtonLoading]}
            onPress={handleContinue}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonRow}>
                <Text style={styles.primaryButtonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webBrand: {
    color: '#00687a',
    fontSize: 22,
    fontWeight: '800',
  },
  webStepBadge: {
    backgroundColor: '#e0f7f4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  webStepText: {
    color: '#00687a',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  scrollContentWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    minHeight: '100%',
  },
  page: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
  },
  pageWeb: {
    flex: 0,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    paddingVertical: 40,
  },
  headerBlock: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  webHeader: {
    marginBottom: 20,
  },
  title: {
    flex: 1,
    color: '#171d1e',
    fontSize: 22,
    fontWeight: '800',
    paddingRight: 8,
    marginBottom: 8,
  },
  stepText: {
    color: '#00687a',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: '#dee3e6',
    overflow: 'hidden',
  },
  progressFill: {
    width: '66.6667%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#06b6d4',
  },
  description: {
    color: '#3d494c',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadCard: {
    minHeight: 240,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#bcc9cd',
    backgroundColor: '#f5fafc',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadCardWeb: {
    minHeight: 200,
  },
  previewWrap: {
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  previewImageWeb: {
    height: 200,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    marginLeft: 6,
    color: '#006c49',
    fontSize: 12,
    fontWeight: '700',
  },
  smallHint: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 12,
  },
  placeholderWrap: {
    alignItems: 'center',
  },
  cameraBadge: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#6cf8bb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    color: '#171d1e',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  placeholderSubtitle: {
    color: '#3d494c',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  webHint: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    color: '#BE185D',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#006c49',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonLoading: {
    backgroundColor: '#94a3b8',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rejectionBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  rejectionText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 12,
    lineHeight: 18,
  },
  rejectionTitle: {
    fontWeight: '800',
  },
});

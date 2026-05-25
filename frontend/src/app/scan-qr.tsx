import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import { DEMO_SCAN_LINKS, parseInvitePayload } from '../services/qrInviteService';

export default function ScanQrScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  const navigateToJoin = useCallback(
    (tontineId: string, token: string) => {
      router.push({
        pathname: '/join-tontine',
        params: { id: tontineId, token },
      } as never);
    },
    [router]
  );

  const handleRawPayload = useCallback(
    (raw: string) => {
      const parsed = parseInvitePayload(raw);
      if (!parsed) {
        Alert.alert(
          'QR non reconnu',
          'Ce code ne correspond pas à une invitation Nkap. Vérifiez le QR ou collez le lien d’invitation.'
        );
        return;
      }
      navigateToJoin(parsed.tontineId, parsed.token);
    },
    [navigateToJoin]
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      handleRawPayload(data);
      setTimeout(() => setScanned(false), 2000);
    },
    [scanned, handleRawPayload]
  );

  const handlePasteSubmit = () => {
    if (!pasteValue.trim()) {
      Alert.alert('Lien vide', 'Collez un lien d’invitation Nkap.');
      return;
    }
    handleRawPayload(pasteValue);
  };

  const showCamera = !isWeb && permission?.granted;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#00687a" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Scanner un QR</Text>
            <Text style={styles.headerSubtitle}>Rejoindre une tontine par invitation</Text>
          </View>
        </View>

        {!isWeb && !permission?.granted ? (
          <View style={styles.permissionBox}>
            <MaterialCommunityIcons name="camera-outline" size={48} color="#00687a" />
            <Text style={styles.permissionTitle}>Accès à la caméra</Text>
            <Text style={styles.permissionText}>
              Nkap a besoin de la caméra pour lire le QR code d’invitation affiché par le trésorier.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Autoriser la caméra</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showCamera ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>Placez le QR d’invitation dans le cadre</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.manualSection, isWeb && styles.manualSectionWeb]}>
          <Text style={styles.manualTitle}>
            {isWeb ? 'Coller le lien d’invitation' : 'Ou coller le lien'}
          </Text>
          <TextInput
            style={styles.pasteInput}
            placeholder="https://nkap.app/join/voyage-2024?token=..."
            placeholderTextColor="#94a3b8"
            value={pasteValue}
            onChangeText={setPasteValue}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePasteSubmit} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Valider le lien</Text>
          </TouchableOpacity>

          <Text style={styles.demoTitle}>Démo — invitations de test</Text>
          {DEMO_SCAN_LINKS.map((demo) => (
            <TouchableOpacity
              key={demo.url}
              style={styles.demoRow}
              activeOpacity={0.85}
              onPress={() => handleRawPayload(demo.url)}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#00687a" />
              <Text style={styles.demoLabel}>{demo.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6d797d" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
    zIndex: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { color: '#00424f', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#6d797d', fontSize: 12, marginTop: 2 },
  permissionBox: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 12,
  },
  permissionTitle: { color: '#171d1e', fontSize: 16, fontWeight: '700' },
  permissionText: { color: '#6d797d', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  cameraWrap: { flex: 1, minHeight: 280, position: 'relative' },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#6cf8bb',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  manualSection: {
    backgroundColor: '#f5fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 24 : 32,
    marginTop: -12,
  },
  manualSectionWeb: { flex: 1, marginTop: 0, borderRadius: 0 },
  manualTitle: { color: '#171d1e', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  pasteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dee3e6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#171d1e',
    fontSize: 13,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  demoTitle: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  demoLabel: { flex: 1, color: '#171d1e', fontSize: 14, fontWeight: '600' },
});

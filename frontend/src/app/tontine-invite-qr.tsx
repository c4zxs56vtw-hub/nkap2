import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import {
  buildInviteUrl,
  buildQrImageUrl,
  getInviteInfo,
  type TontineInviteInfo,
} from '../services/qrInviteService';

export default function TontineInviteQrScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();

  const tontineId = (params.id as string) ?? 'voyage-2024';
  const [invite, setInvite] = useState<TontineInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const info = await getInviteInfo(tontineId);
    setInvite(info);
    setLoading(false);
  }, [tontineId]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteUrl = invite ? buildInviteUrl(invite.tontineId, invite.token) : '';
  const qrUri = inviteUrl ? buildQrImageUrl(inviteUrl, 260) : '';

  const copyLink = async () => {
    if (!inviteUrl) return;
    await Clipboard.setStringAsync(inviteUrl);
    Alert.alert('Lien copié', 'Partagez-le sur WhatsApp ou affichez ce QR en réunion.');
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#00687a" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>QR d’invitation</Text>
            <Text style={styles.headerSubtitle}>Partager la tontine aux nouveaux membres</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb, { paddingBottom: bottomPadding + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
          ) : !invite ? (
            <Text style={styles.errorText}>Invitation introuvable.</Text>
          ) : (
            <>
              <View style={styles.qrCard}>
                <Text style={styles.tontineName}>{invite.title}</Text>
                <Text style={styles.tontineSub}>{invite.subtitle}</Text>
                {qrUri ? (
                  <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
                ) : null}
                <Text style={styles.tokenLabel}>Code : {invite.token}</Text>
              </View>

              <Text style={styles.helpText}>
                Les membres scannent ce QR depuis Nkap → Scanner un QR, ou collent le lien d’invitation.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={copyLink} activeOpacity={0.85}>
                <MaterialCommunityIcons name="content-copy" size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Copier le lien d’invitation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push('/scan-qr' as never)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#00687a" />
                <Text style={styles.secondaryBtnText}>Tester le scan (démo)</Text>
              </TouchableOpacity>

              <View style={styles.urlBox}>
                <Text style={styles.urlText} selectable>
                  {inviteUrl}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5fafc' },
  screen: { flex: 1, backgroundColor: '#f5fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
    gap: 10,
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
  scroll: { padding: 16 },
  scrollWeb: { maxWidth: 440, alignSelf: 'center', width: '100%' },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  tontineName: { color: '#171d1e', fontSize: 18, fontWeight: '800' },
  tontineSub: { color: '#6d797d', fontSize: 13, marginTop: 4, marginBottom: 16 },
  qrImage: { width: 260, height: 260, borderRadius: 12 },
  tokenLabel: {
    marginTop: 14,
    color: '#00687a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  helpText: {
    color: '#6d797d',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e0f7fa',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  secondaryBtnText: { color: '#00687a', fontSize: 14, fontWeight: '700' },
  urlBox: {
    backgroundColor: '#eff4f7',
    borderRadius: 12,
    padding: 12,
  },
  urlText: { color: '#475569', fontSize: 11, lineHeight: 16 },
  errorText: { color: '#b4136d', textAlign: 'center', marginTop: 24 },
});

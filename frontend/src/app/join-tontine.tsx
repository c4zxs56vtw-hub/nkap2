import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import {
  getInviteInfo,
  validateInvite,
  type TontineInviteInfo,
} from '../services/qrInviteService';

export default function JoinTontineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; token?: string }>();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<TontineInviteInfo | null>(null);
  const [error, setError] = useState('');

  const tontineId = (params.id as string) ?? '';
  const token = (params.token as string) ?? '';

  const loadInvite = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!tontineId || !token) {
      setError('Lien d’invitation incomplet.');
      setLoading(false);
      return;
    }
    const result = await validateInvite(tontineId, token);
    if (!result.ok) {
      setError(result.error);
      setInvite(null);
    } else {
      setInvite(result.invite);
    }
    setLoading(false);
  }, [tontineId, token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleJoin = async () => {
    if (!invite) return;
    setJoining(true);
    try {
      // TODO: POST /api/tontines/{id}/join/ avec token
      await new Promise((r) => setTimeout(r, 1200));
      Alert.alert(
        'Bienvenue dans la tontine 🎉',
        `Vous avez rejoint « ${invite.title} ». Vous pouvez accéder au chat de groupe et suivre les cotisations.`,
        [
          {
            text: 'Ouvrir le chat',
            onPress: () =>
              router.replace({
                pathname: '/tontine-chat',
                params: {
                  id: invite.tontineId,
                  title: invite.title,
                  amount: invite.poolAmount,
                  members: String(invite.memberCount + 1),
                },
              } as never),
          },
          { text: 'Dashboard', onPress: () => router.replace('/dashboard' as never) },
        ]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de rejoindre la tontine. Réessayez.');
    } finally {
      setJoining(false);
    }
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#00687a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejoindre une tontine</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb, { paddingBottom: bottomPadding + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#10B981" size="large" />
              <Text style={styles.loadingText}>Vérification de l’invitation...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#b4136d" />
              <Text style={styles.errorTitle}>Invitation refusée</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/scan-qr' as never)}>
                <Text style={styles.secondaryBtnText}>Scanner un autre QR</Text>
              </TouchableOpacity>
            </View>
          ) : invite ? (
            <>
              <View style={styles.heroCard}>
                <View style={[styles.heroIcon, { backgroundColor: invite.iconBg }]}>
                  <MaterialCommunityIcons name={invite.icon as any} size={32} color={invite.iconColor} />
                </View>
                <Text style={styles.heroTitle}>{invite.title}</Text>
                <Text style={styles.heroSubtitle}>{invite.subtitle}</Text>
                {invite.isPrivate ? (
                  <View style={styles.privateBadge}>
                    <Ionicons name="lock-closed" size={12} color="#b4136d" />
                    <Text style={styles.privateText}>Tontine privée · QR requis</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.infoCard}>
                {[
                  { label: 'Cagnotte', value: invite.poolAmount, icon: 'wallet-outline' },
                  {
                    label: 'Membres',
                    value: `${invite.memberCount} / ${invite.maxMembers}`,
                    icon: 'account-group-outline',
                  },
                  {
                    label: 'Places restantes',
                    value: `${invite.spotsLeft}`,
                    icon: 'ticket-outline',
                  },
                  { label: 'Trésorier', value: invite.treasurerName, icon: 'shield-account-outline' },
                ].map((row, i, arr) => (
                  <View key={row.label}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name={row.icon as any} size={20} color="#00687a" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>{row.label}</Text>
                        <Text style={styles.infoValue}>{row.value}</Text>
                      </View>
                    </View>
                    {i < arr.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
                onPress={handleJoin}
                disabled={joining}
                activeOpacity={0.85}
              >
                {joining ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="account-plus-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.joinBtnText}>Rejoindre cette tontine</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : null}
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
  headerTitle: { flex: 1, color: '#00424f', fontSize: 17, fontWeight: '800' },
  scroll: { padding: 16 },
  scrollWeb: { maxWidth: 520, alignSelf: 'center', width: '100%' },
  centerBox: { alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 24 },
  loadingText: { color: '#6d797d', fontSize: 14 },
  errorTitle: { color: '#171d1e', fontSize: 18, fontWeight: '800' },
  errorText: { color: '#6d797d', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  secondaryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e0f7fa',
  },
  secondaryBtnText: { color: '#00687a', fontWeight: '700' },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: '#171d1e', fontSize: 20, fontWeight: '800' },
  heroSubtitle: { color: '#6d797d', fontSize: 13, marginTop: 4 },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ffd9e41f',
  },
  privateText: { color: '#b4136d', fontSize: 11, fontWeight: '600' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 14,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { color: '#6d797d', fontSize: 11, fontWeight: '600' },
  infoValue: { color: '#171d1e', fontSize: 14, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eff4f7', marginVertical: 12, marginLeft: 32 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
  },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useResponsive } from '../hooks/use-responsive';
import { MY_TONTINES } from '../services/tontineChatService';
import api from '../services/api';

const QUICK_ACTIONS = [
  { label: 'Créer une tontine', icon: 'plus-circle-outline' as const, route: '/create-tontine' as const },
  { label: 'Rejoindre', icon: 'account-multiple-plus-outline' as const, route: '/explorer-tontines' as const },
  { label: 'Scanner un QR', icon: 'qrcode-scan' as const, route: '/scan-qr' as const },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isDesktop, contentMaxWidth } = useResponsive();
  const bottomPadding = Math.max(insets.bottom, 8);
  const [isVerified, setIsVerified] = useState(true);
  const [balance, setBalance] = useState('0');
  const [tontines, setTontines] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const checkKycAndBalance = useCallback(async () => {
    try {
      const response = await api.get('/auth/me/');
      if (response.data) {
        const status = response.data.kyc_status;
        setIsVerified(status ? status.toUpperCase() === 'VERIFIED' : false);
        await SecureStore.setItemAsync('user_status', status);

        const rawBalance = response.data.balance;
        if (rawBalance !== undefined) {
          const formatted = parseFloat(rawBalance).toLocaleString('fr-FR');
          setBalance(formatted);
        }

        const rawTontines = response.data.tontines;
        if (Array.isArray(rawTontines)) {
          setTontines(rawTontines);
        }

        if (response.data.full_name) setUserName(response.data.full_name);
        if (response.data.phone_number) setPhoneNumber(response.data.phone_number);
        if (response.data.qrImageUrl) setQrImageUrl(response.data.qrImageUrl);
        if (response.data.avatarUrl) setAvatarUrl(response.data.avatarUrl);
      }
    } catch {
      const status = await SecureStore.getItemAsync('user_status');
      setIsVerified(status ? status.toUpperCase() === 'VERIFIED' : false);
    }
  }, []);

  useEffect(() => {
    checkKycAndBalance();
  }, [checkKycAndBalance]);

  useFocusEffect(
    useCallback(() => {
      checkKycAndBalance();
    }, [checkKycAndBalance])
  );

  const shareQrLink = async () => {
    try {
      await Share.share({
        message: `Envoyez-moi de l'argent sur Nkap ! Mon numéro : ${phoneNumber}`,
        title: 'Mon QR Nkap',
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={[styles.topBarInner, isWeb && { maxWidth: isDesktop ? 1100 : 800, alignSelf: 'center', width: '100%' }]}>
            <View style={styles.brandGroup}>
              <View style={styles.profileWrap}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../../assets/images/logo-glow.png')}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.flagBadge}>
                  <Text style={styles.flagBadgeText}>CM</Text>
                </View>
              </View>
              <Text style={styles.brand}>Nkap</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton} 
              activeOpacity={0.85}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={20} color="#EC4899" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb
              ? styles.scrollContentWeb
              : { paddingBottom: 96 + bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Layout web : sidebar + contenu */}
          {isWeb ? (
            <View style={[styles.webLayout, isDesktop && styles.webLayoutDesktop]}>
              {/* Sidebar web */}
              {isDesktop && (
                <View style={styles.sidebar}>
                  <Text style={styles.sidebarTitle}>Navigation</Text>
                  {[
                    { icon: 'view-dashboard', label: 'Dashboard', active: true, route: '/dashboard' },
                    { icon: 'swap-horizontal', label: 'Transfer', active: false, route: '/transfers' },
                    { icon: 'forum-outline', label: 'Messagerie', active: false, route: '/tontine-messages' },
                    { icon: 'account-outline', label: 'Profile', active: false, route: '/profile' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.sidebarItem, item.active && styles.sidebarItemActive]}
                      onPress={() => item.route && router.replace(item.route as never)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={item.active ? '#00424f' : '#3d494c'}
                      />
                      <Text style={[styles.sidebarLabel, item.active && styles.sidebarLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Contenu principal */}
              <View style={[styles.webMain, contentMaxWidth && !isDesktop ? { maxWidth: contentMaxWidth } : undefined]}>
        <DashboardContent
              router={router}
              isWeb={isWeb}
              isVerified={isVerified}
              balance={balance}
              tontines={tontines}
              onShowQr={() => setShowQrModal(true)}
            />
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <DashboardContent
              router={router}
              isWeb={false}
              isVerified={isVerified}
              balance={balance}
              tontines={tontines}
              onShowQr={() => setShowQrModal(true)}
            />
            </View>
          )}
        </ScrollView>

        {/* Bottom nav — mobile only */}
        {!isWeb && (
          <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navItem, styles.navItemActive]}
                activeOpacity={0.85}
                onPress={() => router.replace('/dashboard' as never)}
              >
                <MaterialCommunityIcons name="view-dashboard" size={24} color="#00424f" />
                <Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/transfers' as never)}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/tontine-messages' as never)}
              >
                <MaterialCommunityIcons name="forum-outline" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Messagerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/profile' as never)}
              >
                <MaterialCommunityIcons name="account-outline" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Modal QR Code */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQrModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mon QR Nkap</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Faites scanner ce code pour recevoir un paiement
            </Text>

            {qrImageUrl ? (
              <View style={styles.qrWrapper}>
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.qrWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#6d797d' }}>Chargement…</Text>
              </View>
            )}

            <View style={styles.modalPhoneRow}>
              <Text style={styles.modalPhoneLabel}>Numéro Nkap</Text>
              <Text style={styles.modalPhone}>{phoneNumber || '—'}</Text>
            </View>

            <TouchableOpacity style={styles.modalShareBtn} onPress={shareQrLink} activeOpacity={0.85}>
              <Text style={styles.modalShareText}>Partager mon lien</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DashboardContent({ router, isWeb, isVerified, balance, tontines, onShowQr }: { router: any; isWeb: boolean; isVerified: boolean; balance: string; tontines: any[]; onShowQr: () => void }) {
  const handleAction = (route: string) => {
    if (!isVerified) {
      Alert.alert(
        "Vérification requise",
        "Votre compte est en cours de validation par un administrateur. Vous ne pouvez pas créer ni rejoindre de tontine pour le moment."
      );
      return;
    }
    router.push(route as never);
  };

  return (
    <>
      {/* Banner validation */}
      {!isVerified && (
        <View style={styles.kycWarningBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#9F1239" />
          <Text style={styles.kycWarningText}>
            Votre compte est en attente de vérification par l'administration. La création et la participation aux tontines sont temporairement désactivées.
          </Text>
        </View>
      )}

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceTextWrap}>
          <Text style={styles.balanceLabel}>Solde Total Épargné</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balance}</Text>
            <Text style={styles.balanceCurrency}>FCFA</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.qrBtn} onPress={onShowQr} activeOpacity={0.85}>
          <MaterialCommunityIcons name="qrcode" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.balanceGlowTop} />
        <View style={styles.balanceGlowBottom} />
      </View>

      {/* Quick actions */}
      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => {
              if ('route' in action && action.route) {
                handleAction(action.route);
              }
            }}
          >
            <View style={styles.quickActionIconWrap}>
              <MaterialCommunityIcons name={action.icon} size={28} color="#00687a" />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section tontines */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Tontines Actives</Text>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
            if (!isVerified) {
              Alert.alert(
                "Vérification requise",
                "Votre compte est en cours de validation par un administrateur."
              );
              return;
            }
          }}
        >
          <Text style={styles.sectionLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.cardsList, isWeb && styles.cardsListWeb]}>
        {tontines.length === 0 ? (
          <View style={[styles.emptyState, isWeb && { flex: 1 }]}>
            <MaterialCommunityIcons name="wallet-membership" size={44} color="#bcc9cd" />
            <Text style={styles.emptyStateTitle}>Aucune tontine active</Text>
            <Text style={styles.emptyStateSubtitle}>
              Vous n'êtes membre d'aucune tontine pour le moment.
            </Text>
          </View>
        ) : (
          tontines.map((item) => (
            <View key={item.id} style={[styles.tontineCard, isWeb && styles.tontineCardWeb]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (!isVerified) {
                  Alert.alert(
                    "Vérification requise",
                    "Votre compte est en cours de validation par un administrateur."
                  );
                  return;
                }
                router.push({
                  pathname: '/tontine-chat',
                  params: {
                    id: item.id,
                    title: item.title,
                    amount: item.poolAmount,
                    members: String(item.activeMembers),
                  },
                } as never);
              }}
            >
              <View style={styles.tontineHeader}>
                <View style={styles.tontineLeft}>
                  <View style={[styles.tontineIconWrap, { backgroundColor: item.iconBg }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.tontineInfo}>
                    <Text style={styles.tontineTitle}>{item.title}</Text>
                    <Text style={styles.tontineSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.tontineRight}>
                  <Text style={styles.tontineAmount}>{item.poolAmount}</Text>
                  <Text style={styles.tontineTotal}>Cagnotte active</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
            </TouchableOpacity>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={[styles.chatBtn, styles.cardActionHalf]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isVerified) {
                    Alert.alert(
                      "Vérification requise",
                      "Votre compte est en cours de validation par un administrateur."
                    );
                    return;
                  }
                  router.push({
                    pathname: '/tontine-chat',
                    params: {
                      id: item.id,
                      title: item.title,
                      amount: item.poolAmount,
                      members: String(item.activeMembers),
                    },
                  } as never);
                }}
              >
                <MaterialCommunityIcons name="forum-outline" size={16} color="#00687a" />
                <Text style={styles.chatBtnText}>Discuter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inviteBtn, styles.cardActionHalf]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isVerified) {
                    Alert.alert(
                      "Vérification requise",
                      "Votre compte est en cours de validation par un administrateur."
                    );
                    return;
                  }
                  router.push({
                    pathname: '/tontine-invite-qr',
                    params: { id: item.id },
                  } as never);
                }}
              >
                <MaterialCommunityIcons name="qrcode" size={16} color="#b4136d" />
                <Text style={styles.inviteBtnText}>QR inviter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#f5fafc' },
  topBar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#06b6d4',
    overflow: 'hidden',
    backgroundColor: '#f3f8fb',
  },
  profileImage: { width: '100%', height: '100%' },
  flagBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dee3e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBadgeText: { color: '#006c49', fontSize: 8, fontWeight: '800' },
  brand: { color: '#00687a', fontSize: 20, fontWeight: '800' },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentWeb: {
    flexGrow: 1,
    paddingVertical: 0,
  },
  /* Web layout */
  webLayout: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  webLayoutDesktop: {
    flexDirection: 'row',
    maxWidth: 1100,
    gap: 32,
    paddingTop: 32,
  },
  sidebar: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sidebarTitle: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarItemActive: { backgroundColor: '#6cf8bb' },
  sidebarLabel: { color: '#3d494c', fontSize: 14, fontWeight: '600' },
  sidebarLabelActive: { color: '#00424f', fontWeight: '700' },
  webMain: { flex: 1 },
  /* Mobile content */
  content: { paddingHorizontal: 16, paddingTop: 16 },
  balanceCard: {
    minHeight: 120,
    borderRadius: 16,
    backgroundColor: '#10B981',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#475569',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 24,
  },
  balanceTextWrap: { zIndex: 2 },
  balanceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  balanceRow: { marginTop: 4, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  balanceCurrency: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  balanceGlowTop: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -16,
    top: -12,
  },
  balanceGlowBottom: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(2,6,23,0.06)',
    left: -8,
    bottom: -8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  quickAction: { width: '31%', alignItems: 'center' },
  quickActionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#475569',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickActionLabel: {
    marginTop: 8,
    color: '#171d1e',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 76,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#171d1e', fontSize: 20, fontWeight: '600' },
  sectionLink: { color: '#00687a', fontSize: 12, fontWeight: '600' },
  cardsList: { gap: 12 },
  cardsListWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tontineCard: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 12,
  },
  tontineCardWeb: {
    flex: 1,
    minWidth: 260,
  },
  tontineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tontineLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 12 },
  tontineIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tontineInfo: { marginLeft: 12, flex: 1 },
  tontineTitle: { color: '#171d1e', fontSize: 14, fontWeight: '700' },
  tontineSubtitle: { marginTop: 2, color: '#3d494c', fontSize: 12 },
  tontineRight: { alignItems: 'flex-end' },
  tontineAmount: { color: '#171d1e', fontSize: 14, fontWeight: '700' },
  tontineTotal: { marginTop: 2, color: '#6d797d', fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#dee3e6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#10B981' },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cardActionHalf: { flex: 1 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  chatBtnText: { color: '#00687a', fontSize: 12, fontWeight: '700' },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffd9e41f',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  inviteBtnText: { color: '#b4136d', fontSize: 12, fontWeight: '700' },
  /* Bottom nav */
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5fafc',
    borderTopWidth: 1,
    borderTopColor: '#dee3e6',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  navItem: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
  },
  navItemActive: { backgroundColor: '#6cf8bb' },
  navLabel: { marginTop: 2, color: '#3d494c', fontSize: 10 },
  navLabelActive: { color: '#00424f', fontWeight: '700' },
  kycWarningBanner: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  kycWarningText: {
    flex: 1,
    color: '#9F1239',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee3e6',
    borderStyle: 'dashed',
    width: '100%',
  },
  emptyStateTitle: {
    color: '#171d1e',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyStateSubtitle: {
    color: '#6d797d',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 240,
  },
  /* QR button in balance card */
  qrBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  /* Modal QR */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: { color: '#00424f', fontSize: 18, fontWeight: '800' },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#6d797d', fontSize: 16, fontWeight: '700' },
  modalSubtitle: {
    color: '#6d797d',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  qrWrapper: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5fafc',
  },
  qrImage: { width: '100%', height: '100%' },
  modalPhoneRow: {
    width: '100%',
    backgroundColor: '#f5fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPhoneLabel: { color: '#6d797d', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  modalPhone: { color: '#00424f', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  modalShareBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalShareText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

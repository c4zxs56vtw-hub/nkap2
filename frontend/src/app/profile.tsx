import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { secureStore as SecureStore } from '../utils/secureStore';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/authService';
import { useResponsive } from '../hooks/use-responsive';
import api from '../services/api';

export const ADMIN_MODE_KEY = 'nkap_admin_mode';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isDesktop, contentMaxWidth } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [linkedMethod, setLinkedMethod] = useState('');
  const [linkedMomoPhone, setLinkedMomoPhone] = useState('');
  const [linkedBankName, setLinkedBankName] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const [method, momoPhone, bankName, status, storedRole] = await Promise.all([
        SecureStore.getItemAsync('linked_account_method'),
        SecureStore.getItemAsync('linked_momo_phone'),
        SecureStore.getItemAsync('linked_bank_name'),
        SecureStore.getItemAsync('user_status'),
        SecureStore.getItemAsync('user_role'),
      ]);
      setLinkedMethod(method ?? '');
      setLinkedMomoPhone(momoPhone ?? '');
      setLinkedBankName(bankName ?? '');
      setUserStatus(status ?? '');
      setRole(storedRole ?? 'MEMBER');
      setIsAdminMode(storedRole ? storedRole !== 'MEMBER' : false);
    } catch {
      // silently fail
    }

    // Charger les données depuis l'API
    try {
      const response = await api.get('/auth/me/');
      if (response.data) {
        if (response.data.avatarUrl) setAvatarUrl(response.data.avatarUrl);
        if (response.data.full_name) setFullName(response.data.full_name);
        if (response.data.phone_number) setPhoneNumber(response.data.phone_number);
        if (response.data.role) {
          setRole(response.data.role);
          setIsAdminMode(response.data.role !== 'MEMBER');
          await SecureStore.setItemAsync('user_role', response.data.role);
        }
        if (response.data.kyc_status) {
          setUserStatus(response.data.kyc_status);
          await SecureStore.setItemAsync('user_status', response.data.kyc_status);
        }
      }
    } catch {
      // utiliser les données du SecureStore en fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleAdminModeToggle = async (enabled: boolean) => {
    setIsAdminMode(enabled);
    try {
      await SecureStore.setItemAsync(ADMIN_MODE_KEY, enabled ? 'true' : 'false');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le mode administrateur.");
      setIsAdminMode(!enabled);
    }
  };

  const accountLabel = (() => {
    if (linkedMethod === 'bank' && linkedBankName) return linkedBankName;
    if (linkedMethod === 'momo' && linkedMomoPhone) return `+237 ${linkedMomoPhone}`;
    return 'Aucun compte lié';
  })();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.replace('/auth/login' as never);
    } catch {
      Alert.alert('Erreur', 'Impossible de déconnecter votre session.');
    }
  };

  const handlePickAvatar = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "Nkap a besoin d'accéder à votre galerie pour changer votre photo de profil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nkap a besoin d'accéder à votre caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
  };

  const uploadAvatar = async (uri: string, mimeType: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() ?? 'avatar.jpg';
      formData.append('avatar', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await api.post('/auth/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.avatarUrl) {
        setAvatarUrl(response.data.avatarUrl + `?t=${Date.now()}`);
      }
      Alert.alert('✓ Photo mise à jour', 'Votre photo de profil a été modifiée.');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo. Réessayez.');
    } finally {
      setUploading(false);
    }
  };

  const showAvatarOptions = () => {
    Alert.alert('Photo de profil', 'Choisissez une option', [
      { text: 'Prendre une photo', onPress: handleTakePhoto },
      { text: 'Choisir dans la galerie', onPress: handlePickAvatar },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const bottomInset = Math.max(insets.bottom, 8);

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
              : { paddingBottom: 96 + bottomInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isWeb ? (
            <View style={[styles.webLayout, isDesktop && styles.webLayoutDesktop]}>
              {/* Sidebar desktop */}
              {isDesktop && (
                <View style={styles.sidebar}>
                  <Text style={styles.sidebarTitle}>Navigation</Text>
                  {[
                    { icon: 'view-dashboard-outline', label: 'Dashboard', active: false, route: '/dashboard' },
                    { icon: 'send-outline', label: 'Transfer', active: false, route: '/transfers' },
                    { icon: 'forum-outline', label: 'Messagerie', active: false, route: '/tontine-messages' },
                    { icon: 'account', label: 'Profile', active: true, route: '/profile' },
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

              {/* Main content */}
              <View style={[styles.webMain, contentMaxWidth && !isDesktop ? { maxWidth: contentMaxWidth } : undefined]}>
                <ProfileContent
                  loading={loading}
                  userStatus={userStatus}
                  linkedMethod={linkedMethod}
                  accountLabel={accountLabel}
                  router={router}
                  handleLogout={handleLogout}
                  isAdminMode={isAdminMode}
                  onAdminModeToggle={handleAdminModeToggle}
                  avatarUrl={avatarUrl}
                  uploading={uploading}
                  onChangeAvatar={showAvatarOptions}
                  fullName={fullName}
                  phoneNumber={phoneNumber}
                />
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <ProfileContent
                loading={loading}
                userStatus={userStatus}
                linkedMethod={linkedMethod}
                accountLabel={accountLabel}
                router={router}
                handleLogout={handleLogout}
                isAdminMode={isAdminMode}
                onAdminModeToggle={handleAdminModeToggle}
                avatarUrl={avatarUrl}
                uploading={uploading}
                onChangeAvatar={showAvatarOptions}
                fullName={fullName}
                phoneNumber={phoneNumber}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom nav — mobile only */}
        {!isWeb && (
          <View style={[styles.bottomNav, { paddingBottom: bottomInset }]}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/dashboard' as never)}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/transfers' as never)}
              >
                <MaterialCommunityIcons name="send-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.8}
                onPress={() => router.replace('/tontine-messages' as never)}
              >
                <MaterialCommunityIcons name="forum-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Messagerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navItem, styles.navItemActive]}
                activeOpacity={0.85}
                onPress={() => router.replace('/profile' as never)}
              >
                <MaterialCommunityIcons name="account" size={22} color="#00424f" />
                <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ProfileContent({
  loading,
  userStatus,
  linkedMethod,
  accountLabel,
  router,
  handleLogout,
  isAdminMode,
  onAdminModeToggle,
  avatarUrl,
  uploading,
  onChangeAvatar,
  fullName,
  phoneNumber,
}: {
  loading: boolean;
  userStatus: string;
  linkedMethod: string;
  accountLabel: string;
  router: ReturnType<typeof useRouter>;
  handleLogout: () => void;
  isAdminMode: boolean;
  onAdminModeToggle: (enabled: boolean) => void;
  avatarUrl: string | null;
  uploading: boolean;
  onChangeAvatar: () => void;
  fullName: string;
  phoneNumber: string;
}) {
  return (
    <>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          {/* Avatar avec bouton d'édition */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onChangeAvatar}
            activeOpacity={0.85}
            disabled={uploading}
          >
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('../../assets/images/logo-glow.png')}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              )}
            </View>
            {/* Badge caméra */}
            <View style={styles.cameraBtn}>
              {uploading ? (
                <ActivityIndicator size={10} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.heroTextBlock}>
            <Text style={styles.heroKicker}>Profil utilisateur</Text>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {fullName || 'Votre compte Nkap'}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {phoneNumber || 'Consultez et modifiez vos informations.'}
            </Text>
          </View>
        </View>
        <View style={styles.heroBadges}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{userStatus || 'STATUT INCONNU'}</Text>
          </View>
          <View style={styles.linkedPill}>
            <Text style={styles.linkedPillText}>
              {linkedMethod === 'bank' ? 'Compte bancaire' : linkedMethod === 'momo' ? 'Mobile Money' : 'Aucun moyen lié'}
            </Text>
          </View>
        </View>
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />
      </View>

      {/* Info card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Informations principales</Text>
      </View>
      <View style={styles.infoCard}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#10B981" />
            <Text style={styles.loadingText}>Chargement du profil...</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#06b6d41a' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#00687a" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Statut KYC</Text>
                <Text style={styles.infoValue}>{userStatus || 'Non défini'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#6cf8bb33' }]}>
                <MaterialCommunityIcons name="bank-outline" size={20} color="#006c49" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Compte lié</Text>
                <Text style={styles.infoValue}>{accountLabel}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#ffd9e41f' }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#b4136d" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Sécurité</Text>
                <Text style={styles.infoValue}>Données enregistrées localement</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Actions rapides */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
      </View>
      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.8}
          onPress={() => router.replace('/auth/kyc' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#06b6d41a' }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#00687a" />
          </View>
          <View style={styles.actionTextBlock}>
            <Text style={styles.actionTitle}>Modifier la vérification</Text>
            <Text style={styles.actionSubtitle}>Reprendre le parcours KYC</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6d797d" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.8}
          onPress={() => router.push('/auth/kyc-step-2' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#6cf8bb33' }]}>
            <MaterialCommunityIcons name="link-variant" size={20} color="#006c49" />
          </View>
          <View style={styles.actionTextBlock}>
            <Text style={styles.actionTitle}>Lier un compte</Text>
            <Text style={styles.actionSubtitle}>Mobile Money ou banque</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6d797d" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Assistance & Rôles */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assistance & Rôles</Text>
      </View>
      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.8}
          onPress={() => router.push('/tontine-messages' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#10b9811a' }]}>
            <MaterialCommunityIcons name="forum-outline" size={20} color="#006c49" />
          </View>
          <View style={styles.actionTextBlock}>
            <Text style={styles.actionTitle}>Messagerie de groupe</Text>
            <Text style={styles.actionSubtitle}>Discuter avec les membres de vos tontines</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6d797d" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.8}
          onPress={() => router.push('/admin-chat' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#0284c71a' }]}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color="#0284c7" />
          </View>
          <View style={styles.actionTextBlock}>
            <Text style={styles.actionTitle}>Contacter le support admin</Text>
            <Text style={styles.actionSubtitle}>Discussion en direct avec Support Nkap</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6d797d" />
        </TouchableOpacity>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5fafc' },
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
  scrollContentWeb: { flexGrow: 1 },
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
  content: { paddingHorizontal: 16, paddingTop: 16 },
  heroCard: {
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
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  avatar: { width: '100%', height: '100%' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00424f',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: { flex: 1, marginLeft: 14 },
  heroKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  heroTitle: { marginTop: 2, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 17 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  linkedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  linkedPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  heroGlowTop: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -16,
    top: -12,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(2,6,23,0.06)',
    left: -8,
    bottom: -8,
  },
  sectionHeader: { marginTop: 4, marginBottom: 10 },
  sectionTitle: { color: '#171d1e', fontSize: 20, fontWeight: '600' },
  infoCard: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 12,
    marginBottom: 24,
  },
  loadingBox: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#3d494c', fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1, marginLeft: 12 },
  infoLabel: { color: '#6d797d', fontSize: 11, fontWeight: '600' },
  infoValue: { marginTop: 2, color: '#171d1e', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#dee3e6', marginVertical: 12 },
  actionsCard: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  actionRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center' },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBlock: { flex: 1, marginLeft: 12, marginRight: 10 },
  actionTitle: { color: '#171d1e', fontSize: 14, fontWeight: '700' },
  actionSubtitle: { marginTop: 2, color: '#6d797d', fontSize: 12 },
  actionDivider: { height: 1, backgroundColor: '#dee3e6' },
  logoutButton: {
    minHeight: 48,
    marginVertical: 12,
    borderRadius: 14,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
});

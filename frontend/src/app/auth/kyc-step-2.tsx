import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useResponsive } from '../../hooks/use-responsive';

type AccountTab = 'momo' | 'bank';

const BANK_OPTIONS = [
  'Afriland First Bank',
  'Société Générale Cameroun',
  'United Bank for Africa',
  'Ecobank',
];

export default function KycStepThreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, contentMaxWidth, hPad } = useResponsive();
  const [activeTab, setActiveTab] = useState<AccountTab>('momo');
  const [momoPhone, setMomoPhone] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankKey, setBankKey] = useState('');
  const [saving, setSaving] = useState(false);

  const saveLink = async (data: Record<string, string>) => {
    await Promise.all(
      Object.entries(data).map(([key, value]) => SecureStore.setItemAsync(key, value))
    );
  };

  const handleLinkMomo = async () => {
    const normalizedPhone = momoPhone.replace(/\s+/g, '').trim();
    if (!normalizedPhone) {
      Alert.alert('Champ requis', 'Veuillez renseigner votre numéro de téléphone.');
      return;
    }
    setSaving(true);
    try {
      await saveLink({ linked_account_method: 'momo', linked_momo_phone: normalizedPhone });
      router.replace('/dashboard' as never);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer votre compte Mobile Money.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkBank = async () => {
    const normalizedBankCode = bankCode.replace(/\s+/g, '').trim();
    const normalizedBranch = bankBranch.replace(/\s+/g, '').trim();
    const normalizedAccount = bankAccount.replace(/\s+/g, '').trim();
    const normalizedKey = bankKey.replace(/\s+/g, '').trim();

    if (!selectedBank) {
      Alert.alert('Champ requis', 'Veuillez sélectionner une banque.');
      return;
    }
    if (!normalizedBankCode || !normalizedBranch || !normalizedAccount || !normalizedKey) {
      Alert.alert('Champs requis', 'Veuillez compléter tous les champs du RIB.');
      return;
    }
    setSaving(true);
    try {
      await saveLink({
        linked_account_method: 'bank',
        linked_bank_name: selectedBank,
        linked_bank_code: normalizedBankCode,
        linked_bank_branch: normalizedBranch,
        linked_bank_account: normalizedAccount,
        linked_bank_key: normalizedKey,
      });
      router.replace('/dashboard' as never);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer votre compte bancaire.");
    } finally {
      setSaving(false);
    }
  };

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.brandGroup}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../../assets/images/logo-glow.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brand}>Nkap</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Notifications', 'Aucune notification pour le moment.')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#00687a" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isWeb
                ? styles.scrollContentWeb
                : { paddingBottom: 100 + bottomInset },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.content,
                isWeb && styles.contentWeb,
                isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
                { paddingHorizontal: isWeb ? 40 : hPad },
              ]}
            >
              <View style={styles.titleBlock}>
                <Text style={styles.pageTitle}>Lier un compte</Text>
                <Text style={styles.pageSubtitle}>
                  Choisissez une méthode pour connecter vos fonds.
                </Text>
              </View>

              {/* Tabs */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'momo' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('momo')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabLabel, activeTab === 'momo' && styles.tabLabelActive]}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'bank' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('bank')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabLabel, activeTab === 'bank' && styles.tabLabelActive]}>
                    Compte Bancaire
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MoMo */}
              {activeTab === 'momo' ? (
                <View style={styles.card}>
                  <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                  <View style={styles.momoInputRow}>
                    <View style={styles.momoBadges}>
                      <View style={[styles.badgeCircle, styles.badgeOrange]}>
                        <Text style={styles.badgeLetter}>O</Text>
                      </View>
                      <View style={[styles.badgeCircle, styles.badgeYellow]}>
                        <Text style={styles.badgeLetterDark}>M</Text>
                      </View>
                    </View>
                    <Text style={styles.prefix}>+237</Text>
                    <View style={styles.prefixDivider} />
                    <TextInput
                      style={styles.momoInput}
                      placeholder="6XX XXX XXX"
                      placeholderTextColor="#6d797d"
                      keyboardType="phone-pad"
                      value={momoPhone}
                      onChangeText={setMomoPhone}
                      editable={!saving}
                    />
                  </View>
                  <View style={styles.securityBox}>
                    <MaterialCommunityIcons name="shield-check" size={18} color="#006c49" />
                    <Text style={styles.securityText}>
                      <Text style={styles.securityTextBold}>Sécurité MoMo Match active : </Text>
                      Vérification automatique du nom de la CNI pour garantir la sécurité de vos transactions.
                    </Text>
                  </View>
                </View>
              ) : (
                /* Bank */
                <View style={styles.card}>
                  <View style={styles.bankGroup}>
                    <Text style={styles.fieldLabel}>Nom de la banque</Text>
                    <Pressable
                      style={styles.selectField}
                      onPress={() => setBankPickerVisible(true)}
                    >
                      <Text
                        style={[styles.selectText, !selectedBank && styles.selectPlaceholder]}
                        numberOfLines={1}
                      >
                        {selectedBank || 'Sélectionner une banque'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={22} color="#3d494c" />
                    </Pressable>
                  </View>

                  <View style={styles.ribGroup}>
                    <Text style={styles.fieldLabel}>Relevé d'Identité Bancaire (RIB CEMAC)</Text>
                    <View style={styles.ribRow}>
                      <View style={[styles.ribField, styles.ribFieldSmall]}>
                        <TextInput
                          style={styles.ribInput}
                          placeholder="00000"
                          placeholderTextColor="#6d797d"
                          maxLength={5}
                          keyboardType="number-pad"
                          value={bankCode}
                          onChangeText={setBankCode}
                          editable={!saving}
                        />
                        <Text style={styles.ribHint}>Banque</Text>
                      </View>
                      <View style={[styles.ribField, styles.ribFieldSmall]}>
                        <TextInput
                          style={styles.ribInput}
                          placeholder="00000"
                          placeholderTextColor="#6d797d"
                          maxLength={5}
                          keyboardType="number-pad"
                          value={bankBranch}
                          onChangeText={setBankBranch}
                          editable={!saving}
                        />
                        <Text style={styles.ribHint}>Guichet</Text>
                      </View>
                      <View style={[styles.ribField, styles.ribFieldLarge]}>
                        <TextInput
                          style={styles.ribInput}
                          placeholder="00000000000"
                          placeholderTextColor="#6d797d"
                          maxLength={11}
                          keyboardType="number-pad"
                          value={bankAccount}
                          onChangeText={setBankAccount}
                          editable={!saving}
                        />
                        <Text style={styles.ribHint}>Compte</Text>
                      </View>
                      <View style={[styles.ribField, styles.ribFieldKey]}>
                        <TextInput
                          style={styles.ribInput}
                          placeholder="00"
                          placeholderTextColor="#6d797d"
                          maxLength={2}
                          keyboardType="number-pad"
                          value={bankKey}
                          onChangeText={setBankKey}
                          editable={!saving}
                        />
                        <Text style={styles.ribHint}>Clé</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={activeTab === 'momo' ? handleLinkMomo : handleLinkBank}
                disabled={saving}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>
                  {activeTab === 'momo' ? 'Lier mon compte MoMo' : 'Lier mon compte bancaire'}
                </Text>
              </TouchableOpacity>

              <View style={styles.securityFooter}>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#bcc9cd" />
                <Text style={styles.securityFooterText}>Cryptage de niveau bancaire (AES-256)</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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
              <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
                <MaterialCommunityIcons name="send-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
                <MaterialCommunityIcons name="credit-card-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Cards</Text>
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

        {/* Bank picker modal */}
        <Modal
          visible={bankPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBankPickerVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setBankPickerVisible(false)}>
            <View style={[styles.modalSheet, isWeb && styles.modalSheetWeb]}>
              <Text style={styles.modalTitle}>Sélectionner une banque</Text>
              {BANK_OPTIONS.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={styles.modalItem}
                  onPress={() => { setSelectedBank(bank); setBankPickerVisible(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalItemText}>{bank}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setBankPickerVisible(false)}
              >
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5fafc' },
  screen: { flex: 1, backgroundColor: '#f5fafc' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#e3e9eb',
  },
  avatar: { width: '100%', height: '100%' },
  brand: { color: '#00687a', fontSize: 18, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    minHeight: '100%',
  },
  content: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 32,
  },
  contentWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    paddingVertical: 40,
  },
  titleBlock: { marginBottom: 18 },
  pageTitle: { color: '#171d1e', fontSize: 24, lineHeight: 32, fontWeight: '700' },
  pageSubtitle: { marginTop: 4, color: '#3d494c', fontSize: 14, lineHeight: 20 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#eff4f7',
    padding: 4,
    borderRadius: 16,
    marginBottom: 18,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: { backgroundColor: '#06b6d4' },
  tabLabel: { color: '#3d494c', fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: '#00424f' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  fieldLabel: { color: '#3d494c', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  momoInputRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4f7',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  momoBadges: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeOrange: { backgroundColor: '#f97316' },
  badgeYellow: { backgroundColor: '#facc15', borderWidth: 1, borderColor: '#eab308' },
  badgeLetter: { color: '#ffffff', fontSize: 8, fontWeight: '800' },
  badgeLetterDark: { color: '#111111', fontSize: 8, fontWeight: '800' },
  prefix: { marginLeft: 10, color: '#3d494c', fontSize: 14 },
  prefixDivider: { width: 1, height: 22, backgroundColor: '#bcc9cd', marginHorizontal: 12 },
  momoInput: { flex: 1, color: '#3d494c', fontSize: 14, paddingVertical: 0 },
  securityBox: {
    marginTop: 16,
    backgroundColor: '#dff7ea',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,248,187,0.7)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  securityText: { flex: 1, color: '#00714d', fontSize: 12, lineHeight: 16 },
  securityTextBold: { fontWeight: '700' },
  bankGroup: { marginBottom: 16 },
  selectField: {
    minHeight: 56,
    backgroundColor: '#eff4f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { flex: 1, color: '#3d494c', fontSize: 14, marginRight: 12 },
  selectPlaceholder: { color: '#6d797d' },
  ribGroup: { gap: 8 },
  ribRow: { flexDirection: 'row', gap: 8 },
  ribField: { minWidth: 0 },
  ribFieldSmall: { flex: 3 },
  ribFieldLarge: { flex: 4 },
  ribFieldKey: { flex: 2 },
  ribInput: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#eff4f7',
    borderRadius: 12,
    color: '#3d494c',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ribHint: { marginTop: 6, color: '#6d797d', fontSize: 10, textAlign: 'center' },
  primaryButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryButtonText: { color: '#00424f', fontSize: 16, fontWeight: '700' },
  securityFooter: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityFooterText: { color: '#bcc9cd', fontSize: 12, fontWeight: '600' },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5fafc',
    borderTopWidth: 1,
    borderTopColor: '#dee3e6',
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  navRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navItem: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navItemActive: { backgroundColor: '#06b6d4' },
  navLabel: { color: '#3d494c', fontSize: 11 },
  navLabelActive: { color: '#00424f', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23,29,30,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  modalSheetWeb: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 40,
  },
  modalTitle: { color: '#171d1e', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#eff4f7',
  },
  modalItemText: { color: '#3d494c', fontSize: 14 },
  modalCloseButton: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    marginTop: 4,
  },
  modalCloseText: { color: '#00424f', fontSize: 14, fontWeight: '700' },
});

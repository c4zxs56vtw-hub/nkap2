import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
import { useResponsive } from '../hooks/use-responsive';

type TontineType = 'privee' | 'publique';
type RuleType = 'amende' | 'retenue';
type OrderType = 'admin' | 'aleatoire' | 'encheres';
type PickerMode = 'frequency' | 'order' | null;

const FREQUENCY_OPTIONS = [
  { label: 'Mensuel', value: 'mensuel' },
  { label: 'Hebdomadaire', value: 'hebdomadaire' },
];

const ORDER_OPTIONS = [
  { label: "Défini par l'Admin", value: 'admin' as const },
  { label: 'Aléatoire', value: 'aleatoire' as const },
  { label: "Système d'enchères", value: 'encheres' as const },
];

export default function CreateTontineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, contentMaxWidth, hPad } = useResponsive();
  const [type, setType] = useState<TontineType>('privee');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('mensuel');
  const [rule, setRule] = useState<RuleType>('amende');
  const [order, setOrder] = useState<OrderType>('admin');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  const bottomInset = Math.max(insets.bottom, 12);

  const typeDescription = useMemo(() => (
    type === 'privee'
      ? 'Seules les personnes invitées peuvent rejoindre.'
      : 'Tout utilisateur de Nkap peut demander à rejoindre.'
  ), [type]);

  const frequencyLabel = FREQUENCY_OPTIONS.find((i) => i.value === frequency)?.label ?? 'Mensuel';
  const orderLabel = ORDER_OPTIONS.find((i) => i.value === order)?.label ?? "Défini par l'Admin";

  const closePicker = () => setPickerMode(null);
  const pickValue = (value: string) => {
    if (pickerMode === 'frequency') setFrequency(value);
    if (pickerMode === 'order') setOrder(value as OrderType);
    closePicker();
  };

  const pickerTitle = pickerMode === 'frequency' ? 'Fréquence des cotisations' : 'Ordre de Passage';
  const pickerOptions = pickerMode === 'frequency' ? FREQUENCY_OPTIONS : ORDER_OPTIONS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={[styles.topBarInner, isWeb && { maxWidth: contentMaxWidth ?? 700, alignSelf: 'center', width: '100%' }]}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.85}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#00687a" />
              </TouchableOpacity>
              <Text style={styles.brand}>Nkap</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AP</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb
              ? styles.scrollContentWeb
              : { paddingBottom: 100 + bottomInset },
          ]}
        >
          <View
            style={[
              styles.container,
              isWeb && styles.containerWeb,
              isWeb && contentMaxWidth ? { width: contentMaxWidth } : undefined,
              { paddingHorizontal: isWeb ? 40 : hPad },
            ]}
          >
            {/* Progress */}
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Créer une Tontine</Text>
                <Text style={styles.progressStep}>Étape 1 sur 3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>

            <View style={styles.sectionSpacing}>
              <Text style={styles.sectionTitle}>Paramètres de base</Text>
              <Text style={styles.sectionSubtitle}>
                Définissez les fondations de votre cercle d&apos;épargne.
              </Text>
            </View>

            {/* Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Type de Tontine</Text>
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[styles.toggleButton, type === 'privee' && styles.toggleButtonActive]}
                  onPress={() => setType('privee')}
                >
                  <Text style={[styles.toggleText, type === 'privee' && styles.toggleTextActive]}>
                    Privée
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleButton, type === 'publique' && styles.toggleButtonActive]}
                  onPress={() => setType('publique')}
                >
                  <Text style={[styles.toggleText, type === 'publique' && styles.toggleTextActive]}>
                    Publique
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.typeDescription, type === 'privee' ? styles.typeDescPrimary : styles.typeDescSecondary]}>
                {typeDescription}
              </Text>
            </View>

            {/* Montant */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Montant de la part (FCFA)</Text>
              <View style={styles.amountFieldWrap}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Ex: 50 000"
                  placeholderTextColor="#bcc9cd"
                  keyboardType="numeric"
                  style={styles.amountInput}
                />
                <Text style={styles.amountSuffix}>XAF</Text>
              </View>
            </View>

            {/* Fréquence */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fréquence des cotisations</Text>
              <Pressable style={styles.selectButton} onPress={() => setPickerMode('frequency')}>
                <Text style={styles.selectButtonText}>{frequencyLabel}</Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#3d494c" />
              </Pressable>
            </View>

            {/* Règles */}
            <View style={styles.rulesSection}>
              <View style={styles.sectionWithIcon}>
                <MaterialCommunityIcons name="alert-outline" size={24} color="#b4136d" />
                <Text style={styles.sectionTitle}>Règles de Retard</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gestion des impayés</Text>
                <Pressable
                  style={[styles.ruleCard, rule === 'amende' && styles.ruleCardActive]}
                  onPress={() => setRule('amende')}
                >
                  <View style={styles.radioOuter}>
                    {rule === 'amende' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.ruleTextWrap}>
                    <Text style={styles.ruleTitle}>Amende immédiate (10%)</Text>
                    <Text style={styles.ruleSubtitle}>Pénalité fixe pour tout retard constaté.</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.ruleCard, rule === 'retenue' && styles.ruleCardActive]}
                  onPress={() => setRule('retenue')}
                >
                  <View style={styles.radioOuter}>
                    {rule === 'retenue' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.ruleTextWrap}>
                    <Text style={styles.ruleTitle}>Retenue à la source</Text>
                    <Text style={styles.ruleSubtitle}>Prélèvement auto sur le prochain tour.</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Ordre */}
            <View style={styles.fieldGroup}>
              <View style={styles.sectionWithIcon}>
                <MaterialCommunityIcons name="reorder-horizontal" size={24} color="#00687a" />
                <Text style={styles.sectionTitle}>Ordre de Passage</Text>
              </View>
              <Text style={styles.label}>Attribution des tours</Text>
              <Pressable style={styles.selectButton} onPress={() => setPickerMode('order')}>
                <Text style={styles.selectButtonText}>{orderLabel}</Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#3d494c" />
              </Pressable>
            </View>

            {/* Trust card */}
            <View style={styles.trustCard}>
              <View style={styles.trustTextWrap}>
                <Text style={styles.trustTitle}>Confiance et Sécurité</Text>
                <Text style={styles.trustSubtitle}>
                  Vos tontines sont protégées par le système de garantie Nkap.
                </Text>
              </View>
              <View style={styles.trustIconWrap}>
                <MaterialCommunityIcons name="shield-check" size={34} color="#06b6d4" />
              </View>
            </View>

            {/* Bouton web inline */}
            {isWeb && (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={() => {
                  if (!amount) {
                    Alert.alert('Champ requis', 'Veuillez saisir le montant de la part.');
                    return;
                  }
                  router.push({
                    pathname: '/create-tontine-step-2' as never,
                    params: { type, amount, frequency, rule, order },
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>Suivant</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Footer fixe — mobile only */}
        {!isWeb && (
          <View style={[styles.footer, { paddingBottom: bottomInset }]}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={() => {
                if (!amount) {
                  Alert.alert('Champ requis', 'Veuillez saisir le montant de la part.');
                  return;
                }
                router.push({
                  pathname: '/create-tontine-step-2' as never,
                  params: { type, amount, frequency, rule, order },
                });
              }}
            >
              <Text style={styles.primaryButtonText}>Suivant</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Picker modal */}
        <Modal
          transparent
          visible={pickerMode !== null}
          animationType="fade"
          onRequestClose={closePicker}
        >
          <Pressable style={styles.modalBackdrop} onPress={closePicker}>
            <View style={[styles.modalSheet, isWeb && styles.modalSheetWeb]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{pickerTitle}</Text>
                  <Text style={styles.modalSubtitle}>Choisissez une valeur.</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseButton} onPress={closePicker}>
                  <Ionicons name="close" size={20} color="#3d494c" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalOptions}>
                {pickerOptions.map((option) => {
                  const isSelected =
                    (pickerMode === 'frequency' && option.value === frequency) ||
                    (pickerMode === 'order' && option.value === order);
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                      onPress={() => pickValue(option.value)}
                    >
                      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && <MaterialCommunityIcons name="check" size={20} color="#10B981" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e9eb',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5fafc',
  },
  brand: { color: '#00687a', fontSize: 24, fontWeight: '800' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#00424f', fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: '100%',
  },
  container: {
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
  },
  containerWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    paddingVertical: 40,
  },
  progressBlock: { marginBottom: 32 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressTitle: { flex: 1, color: '#171d1e', fontSize: 24, fontWeight: '600' },
  progressStep: { color: '#3d494c', fontSize: 12, fontWeight: '600' },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eef3f6',
    overflow: 'hidden',
  },
  progressFill: { width: '33%', height: '100%', borderRadius: 999, backgroundColor: '#10B981' },
  sectionSpacing: { marginBottom: 28 },
  sectionTitle: { color: '#171d1e', fontSize: 22, fontWeight: '600' },
  sectionSubtitle: { marginTop: 4, color: '#3d494c', fontSize: 15, lineHeight: 22 },
  fieldGroup: { marginBottom: 28 },
  label: {
    marginBottom: 12,
    color: '#171d1e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#e9eff1',
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#475569',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleText: { color: '#3d494c', fontSize: 15, fontWeight: '600' },
  toggleTextActive: { color: '#171d1e' },
  typeDescription: { marginTop: 12, fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  typeDescPrimary: { color: '#00687a' },
  typeDescSecondary: { color: '#006c49' },
  amountFieldWrap: {
    position: 'relative',
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: '#eff4f7',
    justifyContent: 'center',
  },
  amountInput: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingRight: 70,
    color: '#171d1e',
    fontSize: 22,
    fontWeight: '700',
  },
  amountSuffix: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
    color: '#3d494c',
    fontSize: 18,
    fontWeight: '700',
  },
  selectButton: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: '#eff4f7',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: { color: '#171d1e', fontSize: 17, fontWeight: '600' },
  rulesSection: { marginBottom: 28 },
  sectionWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#dee3e6',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  ruleCardActive: { borderColor: '#10B981' },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bcc9cd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  ruleTextWrap: { flex: 1, marginLeft: 16 },
  ruleTitle: { color: '#171d1e', fontSize: 15, fontWeight: '700' },
  ruleSubtitle: { marginTop: 2, color: '#3d494c', fontSize: 13 },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#dff7fb',
    marginBottom: 28,
  },
  trustTextWrap: { flex: 1 },
  trustTitle: { color: '#00424f', fontSize: 16, fontWeight: '700' },
  trustSubtitle: { marginTop: 4, color: '#00424f', fontSize: 13, lineHeight: 18 },
  trustIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#475569',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e3e9eb',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: { borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16 },
  modalSheetWeb: {
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: { color: '#171d1e', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { marginTop: 2, color: '#6d797d', fontSize: 12 },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptions: { gap: 10 },
  modalOption: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    backgroundColor: '#f5fafc',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionActive: { borderColor: '#10B981', backgroundColor: '#ecfdf5' },
  modalOptionText: { color: '#171d1e', fontSize: 16, fontWeight: '600' },
  modalOptionTextActive: { color: '#00424f' },
});

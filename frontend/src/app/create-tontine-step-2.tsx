import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/use-responsive';

const RIB_THRESHOLD = 2_000_000; // FCFA — seuil bascule MoMo → RIB

export default function CreateTontineStep2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, contentMaxWidth, hPad } = useResponsive();

  // Données reçues de l'étape 1
  const params = useLocalSearchParams<{
    type: string;
    amount: string;
    frequency: string;
    rule: string;
    order: string;
  }>();

  const amountPerPart = parseInt(params.amount ?? '0', 10);
  const isPublique = params.type === 'publique';

  const [memberCount, setMemberCount] = useState('');
  const [tontineName, setTontineName] = useState('');
  const [description, setDescription] = useState('');
  const [maxWaitDays, setMaxWaitDays] = useState('3');

  const bottomInset = Math.max(insets.bottom, 12);

  // Calcul dynamique du total et détection seuil RIB
  const totalPool = useMemo(() => {
    const count = parseInt(memberCount, 10);
    if (!count || !amountPerPart) return 0;
    return amountPerPart * count;
  }, [memberCount, amountPerPart]);

  const requiresRib = totalPool > RIB_THRESHOLD;

  const formatAmount = (n: number) =>
    n > 0 ? n.toLocaleString('fr-FR') + ' FCFA' : '—';

  const handleNext = () => {
    if (!tontineName.trim()) {
      Alert.alert('Champ requis', 'Veuillez donner un nom à votre tontine.');
      return;
    }
    const count = parseInt(memberCount, 10);
    if (!count || count < 2) {
      Alert.alert('Nombre invalide', 'Une tontine nécessite au moins 2 membres.');
      return;
    }
    if (count > 50) {
      Alert.alert('Limite dépassée', 'Le nombre maximum de membres est 50.');
      return;
    }

    router.push({
      pathname: '/create-tontine-step-3' as never,
      params: {
        ...params,
        memberCount: String(count),
        tontineName: tontineName.trim(),
        description: description.trim(),
        maxWaitDays,
        requiresRib: requiresRib ? '1' : '0',
        totalPool: String(totalPool),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View
            style={[
              styles.topBarInner,
              isWeb && { maxWidth: contentMaxWidth ?? 700, alignSelf: 'center', width: '100%' },
            ]}
          >
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
                <Text style={styles.progressStep}>Étape 2 sur 3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
            </View>

            {/* Récap étape 1 */}
            <View style={styles.recapCard}>
              <View style={styles.recapRow}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.recapText}>
                  {params.type === 'privee' ? 'Tontine Privée' : 'Tontine Publique'}
                  {' · '}
                  {amountPerPart > 0 ? amountPerPart.toLocaleString('fr-FR') + ' FCFA/part' : 'Montant non défini'}
                  {' · '}
                  {params.frequency === 'mensuel' ? 'Mensuel' : 'Hebdomadaire'}
                </Text>
              </View>
            </View>

            {/* Section : Identité */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Identité de la tontine</Text>
              <Text style={styles.sectionSubtitle}>
                Donnez un nom et une description à votre cercle d&apos;épargne.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom de la tontine</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex : Voyage Famille 2026"
                placeholderTextColor="#bcc9cd"
                value={tontineName}
                onChangeText={setTontineName}
                maxLength={60}
              />
              <Text style={styles.charCount}>{tontineName.length}/60</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Décrivez l'objectif de cette tontine..."
                placeholderTextColor="#bcc9cd"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>

            {/* Section : Membres */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Membres</Text>
              <Text style={styles.sectionSubtitle}>
                Définissez la taille du groupe. Min 2 · Max 50.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de membres</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => {
                    const v = Math.max(2, (parseInt(memberCount, 10) || 2) - 1);
                    setMemberCount(String(v));
                  }}
                >
                  <MaterialCommunityIcons name="minus" size={22} color="#00687a" />
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={memberCount}
                  onChangeText={(t) => setMemberCount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor="#bcc9cd"
                  maxLength={2}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => {
                    const v = Math.min(50, (parseInt(memberCount, 10) || 1) + 1);
                    setMemberCount(String(v));
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={22} color="#00687a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calcul dynamique de la cagnotte */}
            {totalPool > 0 && (
              <View style={styles.poolCard}>
                <View style={styles.poolRow}>
                  <View style={styles.poolItem}>
                    <Text style={styles.poolLabel}>Cagnotte par tour</Text>
                    <Text style={styles.poolValue}>{formatAmount(totalPool)}</Text>
                  </View>
                  <View style={styles.poolDivider} />
                  <View style={styles.poolItem}>
                    <Text style={styles.poolLabel}>Commission Nkap (1%)</Text>
                    <Text style={[styles.poolValue, styles.poolValueSmall]}>
                      {formatAmount(Math.round(totalPool * 0.01))}
                    </Text>
                  </View>
                  <View style={styles.poolDivider} />
                  <View style={styles.poolItem}>
                    <Text style={styles.poolLabel}>Versement net</Text>
                    <Text style={[styles.poolValue, styles.poolValueGreen]}>
                      {formatAmount(Math.round(totalPool * 0.99))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Alerte RIB si seuil dépassé */}
            {requiresRib && (
              <View style={styles.ribAlert}>
                <MaterialCommunityIcons name="bank-outline" size={20} color="#00687a" />
                <View style={styles.ribAlertText}>
                  <Text style={styles.ribAlertTitle}>Virement bancaire requis</Text>
                  <Text style={styles.ribAlertSubtitle}>
                    La cagnotte dépasse 2 000 000 FCFA. Le Mobile Money sera désactivé — chaque
                    membre devra renseigner un RIB CEMAC valide (23 chiffres).
                  </Text>
                </View>
              </View>
            )}

            {/* Section : Tontine publique — règles de confiance */}
            {isPublique && (
              <>
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionWithIcon}>
                    <MaterialCommunityIcons name="shield-star-outline" size={22} color="#b4136d" />
                    <Text style={styles.sectionTitle}>Ordre de confiance</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Dans une tontine publique, les 3 premiers tours sont réservés aux profils
                    de confiance (trust_score &gt; 90). Les nouveaux membres sont positionnés
                    en fin de liste.
                  </Text>
                </View>

                <View style={styles.trustRulesCard}>
                  {[
                    { rank: '🥇 Tour 1', desc: 'Réservé · trust_score > 90', color: '#f59e0b' },
                    { rank: '🥈 Tour 2', desc: 'Réservé · trust_score > 90', color: '#94a3b8' },
                    { rank: '🥉 Tour 3', desc: 'Réservé · trust_score > 90', color: '#b45309' },
                    { rank: '📋 Tours suivants', desc: 'Attribués selon l\'ordre choisi', color: '#10B981' },
                  ].map((item, i) => (
                    <View key={i} style={[styles.trustRuleRow, i < 3 && styles.trustRuleRowLocked]}>
                      <Text style={styles.trustRuleRank}>{item.rank}</Text>
                      <Text style={styles.trustRuleDesc}>{item.desc}</Text>
                      {i < 3 && (
                        <MaterialCommunityIcons name="lock" size={16} color="#b4136d" />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Délai de paiement */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Délai de paiement</Text>
              <Text style={styles.sectionSubtitle}>
                Nombre de jours accordés après la date limite avant pénalité.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Jours de grâce</Text>
              <View style={styles.daysRow}>
                {['1', '2', '3', '5', '7'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, maxWaitDays === d && styles.dayChipActive]}
                    onPress={() => setMaxWaitDays(d)}
                  >
                    <Text style={[styles.dayChipText, maxWaitDays === d && styles.dayChipTextActive]}>
                      {d}j
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bouton web inline */}
            {isWeb && (
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Suivant — Récapitulatif</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Footer fixe — mobile only */}
        {!isWeb && (
          <View style={[styles.footer, { paddingBottom: bottomInset }]}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Suivant — Récapitulatif</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
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
  container: { paddingTop: 24, paddingBottom: 24, width: '100%' },
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
  progressBlock: { marginBottom: 24 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#10B981' },
  recapCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapText: { flex: 1, color: '#166534', fontSize: 13, fontWeight: '600' },
  sectionBlock: { marginBottom: 20 },
  sectionTitle: { color: '#171d1e', fontSize: 20, fontWeight: '600' },
  sectionSubtitle: { marginTop: 4, color: '#3d494c', fontSize: 13, lineHeight: 20 },
  sectionWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fieldGroup: { marginBottom: 24 },
  label: {
    marginBottom: 10,
    color: '#171d1e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  textInput: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#171d1e',
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  charCount: {
    marginTop: 4,
    color: '#6d797d',
    fontSize: 11,
    textAlign: 'right',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee3e6',
  },
  counterInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    color: '#171d1e',
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#dee3e6',
  },
  poolCard: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 16,
    marginBottom: 20,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poolItem: { flex: 1, alignItems: 'center' },
  poolDivider: { width: 1, height: 36, backgroundColor: '#dee3e6' },
  poolLabel: { color: '#6d797d', fontSize: 10, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  poolValue: { color: '#171d1e', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  poolValueSmall: { color: '#b4136d', fontSize: 12 },
  poolValueGreen: { color: '#10B981', fontSize: 14 },
  ribAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#dff7fb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#06b6d4',
    padding: 14,
    marginBottom: 24,
  },
  ribAlertText: { flex: 1 },
  ribAlertTitle: { color: '#00424f', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  ribAlertSubtitle: { color: '#00687a', fontSize: 12, lineHeight: 18 },
  trustRulesCard: {
    backgroundColor: '#f5fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    overflow: 'hidden',
    marginBottom: 28,
  },
  trustRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
    gap: 10,
  },
  trustRuleRowLocked: { backgroundColor: '#fff7f7' },
  trustRuleRank: { width: 120, color: '#171d1e', fontSize: 13, fontWeight: '700' },
  trustRuleDesc: { flex: 1, color: '#3d494c', fontSize: 12 },
  daysRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  dayChip: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10B981',
  },
  dayChipText: { color: '#3d494c', fontSize: 15, fontWeight: '700' },
  dayChipTextActive: { color: '#10B981' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});

import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
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
import { safeGoBack } from '../utils/safeNavigation';

// ---------------------------------------------------------------------------
// Données mock — à remplacer par un appel API GET /api/tontines/?type=publique
// ---------------------------------------------------------------------------
const MOCK_TONTINES = [
  {
    id: '1',
    name: 'Voyage Cameroun 2026',
    description: 'Épargne collective pour un voyage en famille au Cameroun.',
    amount: 50000,
    frequency: 'mensuel',
    memberCount: 8,
    maxMembers: 12,
    totalPool: 600000,
    icon: 'airplane' as const,
    iconBg: '#06b6d41a',
    iconColor: '#00687a',
    country: 'CM',
    trustRequired: false,
    spotsLeft: 4,
  },
  {
    id: '2',
    name: 'Moto Express',
    description: 'Achat groupé de motos via partenaire Nkap. Livraison garantie.',
    amount: 54000,
    frequency: 'mensuel',
    memberCount: 7,
    maxMembers: 10,
    totalPool: 540000,
    icon: 'motorbike' as const,
    iconBg: '#6cf8bb33',
    iconColor: '#006c49',
    country: 'CM',
    trustRequired: false,
    spotsLeft: 3,
  },
  {
    id: '3',
    name: 'Scolarité 2026',
    description: 'Financement des frais de scolarité pour la rentrée de septembre.',
    amount: 30000,
    frequency: 'mensuel',
    memberCount: 10,
    maxMembers: 10,
    totalPool: 300000,
    icon: 'school' as const,
    iconBg: '#ffd9e41f',
    iconColor: '#b4136d',
    country: 'CM',
    trustRequired: true,
    spotsLeft: 0,
  },
  {
    id: '4',
    name: 'Épargne Santé',
    description: 'Fonds commun pour couvrir les dépenses médicales imprévues.',
    amount: 25000,
    frequency: 'hebdomadaire',
    memberCount: 5,
    maxMembers: 8,
    totalPool: 200000,
    icon: 'hospital-box-outline' as const,
    iconBg: '#06b6d41a',
    iconColor: '#00687a',
    country: 'CM',
    trustRequired: false,
    spotsLeft: 3,
  },
  {
    id: '5',
    name: 'Électroménager Groupe',
    description: 'Achat collectif d\'électroménager à prix de gros via partenaire.',
    amount: 75000,
    frequency: 'mensuel',
    memberCount: 3,
    maxMembers: 6,
    totalPool: 450000,
    icon: 'television-play' as const,
    iconBg: '#6cf8bb33',
    iconColor: '#006c49',
    country: 'CM',
    trustRequired: false,
    spotsLeft: 3,
  },
  {
    id: '6',
    name: 'Fonds Urgence Famille',
    description: 'Réserve collective pour faire face aux imprévus familiaux.',
    amount: 15000,
    frequency: 'hebdomadaire',
    memberCount: 12,
    maxMembers: 15,
    totalPool: 225000,
    icon: 'home-heart' as const,
    iconBg: '#ffd9e41f',
    iconColor: '#b4136d',
    country: 'CM',
    trustRequired: false,
    spotsLeft: 3,
  },
];

type FilterType = 'tous' | 'mensuel' | 'hebdomadaire' | 'disponible';

export default function ExplorerTontinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isDesktop, contentMaxWidth } = useResponsive();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('tous');
  const [selectedTontine, setSelectedTontine] = useState<typeof MOCK_TONTINES[0] | null>(null);
  const [joining, setJoining] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 8);

  const filtered = useMemo(() => {
    return MOCK_TONTINES.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'tous' ||
        (filter === 'mensuel' && t.frequency === 'mensuel') ||
        (filter === 'hebdomadaire' && t.frequency === 'hebdomadaire') ||
        (filter === 'disponible' && t.spotsLeft > 0);
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const handleJoin = async () => {
    if (!selectedTontine) return;
    setJoining(true);
    try {
      // TODO : POST /api/tontines/{id}/join/
      await new Promise((r) => setTimeout(r, 1200));
      setSelectedTontine(null);
      Alert.alert(
        'Demande envoyée 🎉',
        `Votre demande pour rejoindre "${selectedTontine.name}" a été envoyée. L'administrateur vous confirmera sous peu.`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessayez.');
    } finally {
      setJoining(false);
    }
  };

  const formatAmount = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={[
            styles.topBarInner,
            isWeb && { maxWidth: isDesktop ? 1100 : 800, alignSelf: 'center', width: '100%' },
          ]}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => safeGoBack(router)}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color="#00687a" />
              </TouchableOpacity>
              <View>
                <Text style={styles.pageTitle}>Explorer</Text>
                <Text style={styles.pageSubtitle}>Tontines publiques disponibles</Text>
              </View>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filtered.length}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            !isWeb && { paddingBottom: 24 + bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            styles.content,
            isWeb && styles.contentWeb,
            isWeb && isDesktop && styles.contentDesktop,
          ]}>

            {/* ── Barre de recherche ── */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#6d797d" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une tontine..."
                placeholderTextColor="#bcc9cd"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#bcc9cd" />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Filtres ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {([
                { key: 'tous', label: 'Toutes' },
                { key: 'disponible', label: 'Places dispo' },
                { key: 'mensuel', label: 'Mensuel' },
                { key: 'hebdomadaire', label: 'Hebdomadaire' },
              ] as { key: FilterType; label: string }[]).map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Liste ── */}
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify-close" size={48} color="#dee3e6" />
                <Text style={styles.emptyTitle}>Aucune tontine trouvée</Text>
                <Text style={styles.emptySubtitle}>Essayez un autre filtre ou mot-clé.</Text>
              </View>
            ) : (
              <View style={[styles.grid, isWeb && isDesktop && styles.gridDesktop]}>
                {filtered.map((tontine) => (
                  <TontineCard
                    key={tontine.id}
                    tontine={tontine}
                    isWeb={isWeb}
                    onPress={() => setSelectedTontine(tontine)}
                    formatAmount={formatAmount}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ── Modal détail / rejoindre ── */}
      <Modal
        visible={selectedTontine !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTontine(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !joining && setSelectedTontine(null)}>
          <Pressable style={[styles.modalSheet, isWeb && styles.modalSheetWeb]}>
            {selectedTontine && (
              <>
                {/* Header modal */}
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconWrap, { backgroundColor: selectedTontine.iconBg }]}>
                    <MaterialCommunityIcons
                      name={selectedTontine.icon}
                      size={28}
                      color={selectedTontine.iconColor}
                    />
                  </View>
                  <View style={styles.modalTitleWrap}>
                    <Text style={styles.modalTitle}>{selectedTontine.name}</Text>
                    <Text style={styles.modalCountry}>🇨🇲 Cameroun</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setSelectedTontine(null)}
                    disabled={joining}
                  >
                    <Ionicons name="close" size={20} color="#3d494c" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDesc}>{selectedTontine.description}</Text>

                {/* Grille infos */}
                <View style={styles.modalGrid}>
                  {[
                    { icon: 'cash-multiple', label: 'Part / membre', value: formatAmount(selectedTontine.amount), color: '#10B981' },
                    { icon: 'account-group-outline', label: 'Membres', value: `${selectedTontine.memberCount} / ${selectedTontine.maxMembers}`, color: '#06b6d4' },
                    { icon: 'calendar-clock', label: 'Fréquence', value: selectedTontine.frequency === 'mensuel' ? 'Mensuel' : 'Hebdomadaire', color: '#00687a' },
                    { icon: 'bank-outline', label: 'Cagnotte / tour', value: formatAmount(selectedTontine.totalPool), color: '#006c49' },
                  ].map((item) => (
                    <View key={item.label} style={styles.modalGridItem}>
                      <View style={[styles.modalGridIcon, { backgroundColor: item.color + '1a' }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
                      </View>
                      <Text style={styles.modalGridLabel}>{item.label}</Text>
                      <Text style={styles.modalGridValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Trust score requis */}
                {selectedTontine.trustRequired && (
                  <View style={styles.trustAlert}>
                    <MaterialCommunityIcons name="shield-star-outline" size={18} color="#b4136d" />
                    <Text style={styles.trustAlertText}>
                      Les 3 premiers tours sont réservés aux profils avec un trust_score &gt; 90.
                    </Text>
                  </View>
                )}

                {/* Places restantes */}
                <View style={styles.spotsRow}>
                  <View style={styles.spotsTrack}>
                    <View style={[
                      styles.spotsFill,
                      {
                        width: `${(selectedTontine.memberCount / selectedTontine.maxMembers) * 100}%`,
                        backgroundColor: selectedTontine.spotsLeft === 0 ? '#b4136d' : '#10B981',
                      },
                    ]} />
                  </View>
                  <Text style={[
                    styles.spotsText,
                    { color: selectedTontine.spotsLeft === 0 ? '#b4136d' : '#10B981' },
                  ]}>
                    {selectedTontine.spotsLeft === 0
                      ? 'Complet'
                      : `${selectedTontine.spotsLeft} place${selectedTontine.spotsLeft > 1 ? 's' : ''} restante${selectedTontine.spotsLeft > 1 ? 's' : ''}`}
                  </Text>
                </View>

                {/* Bouton rejoindre */}
                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    selectedTontine.spotsLeft === 0 && styles.joinButtonDisabled,
                    joining && styles.joinButtonLoading,
                  ]}
                  onPress={handleJoin}
                  disabled={selectedTontine.spotsLeft === 0 || joining}
                  activeOpacity={0.85}
                >
                  {joining ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={selectedTontine.spotsLeft === 0 ? 'lock-outline' : 'account-plus-outline'}
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.joinButtonText}>
                        {selectedTontine.spotsLeft === 0 ? 'Tontine complète' : 'Demander à rejoindre'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Composant carte tontine
// ---------------------------------------------------------------------------
function TontineCard({
  tontine,
  isWeb,
  onPress,
  formatAmount,
}: {
  tontine: typeof MOCK_TONTINES[0];
  isWeb: boolean;
  onPress: () => void;
  formatAmount: (n: number) => string;
}) {
  const fillPct = (tontine.memberCount / tontine.maxMembers) * 100;
  const isFull = tontine.spotsLeft === 0;

  return (
    <TouchableOpacity
      style={[styles.card, isWeb && styles.cardWeb, isFull && styles.cardFull]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header carte */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: tontine.iconBg }]}>
          <MaterialCommunityIcons name={tontine.icon} size={22} color={tontine.iconColor} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardName} numberOfLines={1}>{tontine.name}</Text>
          <Text style={styles.cardFreq}>
            {tontine.frequency === 'mensuel' ? 'Mensuel' : 'Hebdomadaire'}
          </Text>
        </View>
        {/* Badge places */}
        <View style={[styles.spotsBadge, isFull && styles.spotsBadgeFull]}>
          <Text style={[styles.spotsBadgeText, isFull && styles.spotsBadgeTextFull]}>
            {isFull ? 'Complet' : `+${tontine.spotsLeft}`}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.cardDesc} numberOfLines={2}>{tontine.description}</Text>

      {/* Montant */}
      <View style={styles.cardAmountRow}>
        <Text style={styles.cardAmountLabel}>Part / membre</Text>
        <Text style={styles.cardAmount}>{formatAmount(tontine.amount)}</Text>
      </View>

      {/* Barre membres */}
      <View style={styles.cardFooter}>
        <View style={styles.membersTrack}>
          <View style={[
            styles.membersFill,
            { width: `${fillPct}%`, backgroundColor: isFull ? '#b4136d' : '#10B981' },
          ]} />
        </View>
        <Text style={styles.membersText}>
          {tontine.memberCount}/{tontine.maxMembers} membres
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5fafc',
  },
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
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: '#00424f',
    fontSize: 18,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: '#6d797d',
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eff4f7',
  },
  countBadgeText: {
    color: '#00687a',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  contentWeb: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    maxWidth: 1100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dee3e6',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#475569',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    color: '#171d1e',
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dee3e6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6cf8bb',
    borderColor: '#6cf8bb',
  },
  filterChipText: {
    color: '#3d494c',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#00424f',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    color: '#171d1e',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#6d797d',
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardWeb: {
    flex: 1,
    minWidth: 320,
    maxWidth: '48%',
  },
  cardFull: {
    opacity: 0.85,
    backgroundColor: '#f8fafb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardName: {
    color: '#171d1e',
    fontSize: 15,
    fontWeight: '700',
  },
  cardFreq: {
    color: '#6d797d',
    fontSize: 12,
    marginTop: 2,
  },
  spotsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#06b6d41a',
  },
  spotsBadgeFull: {
    backgroundColor: '#ffd9e41a',
  },
  spotsBadgeText: {
    color: '#00687a',
    fontSize: 11,
    fontWeight: '700',
  },
  spotsBadgeTextFull: {
    color: '#b4136d',
  },
  cardDesc: {
    color: '#3d494c',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f6',
    marginBottom: 12,
  },
  cardAmountLabel: {
    color: '#6d797d',
    fontSize: 12,
    fontWeight: '500',
  },
  cardAmount: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  membersTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#dee3e6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  membersFill: {
    height: '100%',
    borderRadius: 3,
  },
  membersText: {
    color: '#3d494c',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 42, 51, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalSheetWeb: {
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    color: '#171d1e',
    fontSize: 18,
    fontWeight: '800',
  },
  modalCountry: {
    color: '#3d494c',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    color: '#3d494c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  modalGridItem: {
    width: '48%',
    backgroundColor: '#f5fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee3e6',
  },
  modalGridIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalGridLabel: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '500',
  },
  modalGridValue: {
    color: '#171d1e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  trustAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffd9e41a',
    borderColor: '#ffd9e433',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  trustAlertText: {
    flex: 1,
    color: '#b4136d',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  spotsTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#dee3e6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  spotsFill: {
    height: '100%',
    borderRadius: 4,
  },
  spotsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  joinButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#00687a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00687a',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  joinButtonDisabled: {
    backgroundColor: '#bcc9cd',
    shadowOpacity: 0,
  },
  joinButtonLoading: {
    opacity: 0.8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

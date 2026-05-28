import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import api from '../services/api';

type TransferDirection = 'out' | 'in';
type TransferStatus = 'completed' | 'pending' | 'failed';
type FilterKey = 'all' | 'out' | 'in';

interface TransferItem {
  id: string;
  label: string;
  subtitle: string;
  amount: number;
  direction: TransferDirection;
  status: TransferStatus;
  dateLabel: string;
  time: string;
  method: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
}

interface Totals {
  in: number;
  out: number;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'out', label: 'Envoyés' },
  { key: 'in', label: 'Reçus' },
];

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('fr-FR');
  return amount >= 0 ? `+${abs} FCFA` : `−${abs} FCFA`;
}

function statusLabel(s: TransferStatus): string {
  if (s === 'completed') return 'Validé';
  if (s === 'pending') return 'En cours';
  return 'Échoué';
}

export default function TransfersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();
  const [filter, setFilter] = useState<FilterKey>('all');

  const [transactions, setTransactions] = useState<TransferItem[]>([]);
  const [totals, setTotals] = useState<Totals>({ in: 0, out: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomPadding = Math.max(insets.bottom, 8);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await api.get('/auth/transactions/');
      const data = response.data;

      setTransactions(data.transactions ?? []);
      setTotals(data.totals ?? { in: 0, out: 0 });
    } catch (err: any) {
      setError('Impossible de charger les transactions. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    if (filter === 'out') return transactions.filter((t) => t.direction === 'out' || t.amount < 0);
    return transactions.filter((t) => t.direction === 'in' || t.amount >= 0);
  }, [filter, transactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransferItem[]>();
    filtered.forEach((t) => {
      const list = map.get(t.dateLabel) ?? [];
      list.push(t);
      map.set(t.dateLabel, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00687a" />
          <Text style={styles.loadingText}>Chargement des transactions…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#dee3e6" />
          <Text style={styles.emptyTitle}>Erreur de connexion</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTransactions()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (grouped.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="swap-horizontal" size={48} color="#dee3e6" />
          <Text style={styles.emptyTitle}>Aucun transfert</Text>
          <Text style={styles.emptySubtitle}>Modifiez le filtre pour voir d'autres opérations.</Text>
        </View>
      );
    }

    return grouped.map(([dateLabel, items]) => (
      <View key={dateLabel} style={styles.section}>
        <Text style={styles.sectionDate}>{dateLabel}</Text>
        <View style={styles.listCard}>
          {items.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.transferRow} activeOpacity={0.85}>
                <View style={[styles.transferIcon, { backgroundColor: item.iconBg }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <View style={styles.transferBody}>
                  <View style={styles.transferTop}>
                    <Text style={styles.transferLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.transferAmount,
                        item.amount >= 0 ? styles.amountIn : styles.amountOut,
                      ]}
                    >
                      {formatAmount(item.amount)}
                    </Text>
                  </View>
                  <Text style={styles.transferSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                  <View style={styles.transferMeta}>
                    <Text style={styles.transferMetaText}>
                      {item.time} · {item.method}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'completed' && styles.statusCompleted,
                        item.status === 'pending' && styles.statusPending,
                        item.status === 'failed' && styles.statusFailed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === 'completed' && styles.statusTextCompleted,
                          item.status === 'pending' && styles.statusTextPending,
                          item.status === 'failed' && styles.statusTextFailed,
                        ]}
                      >
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {index < items.length - 1 ? <View style={styles.rowDivider} /> : null}
            </View>
          ))}
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={[styles.headerInner, isWeb && styles.webLimit]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router)} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={24} color="#00687a" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Transferts</Text>
              <Text style={styles.headerSubtitle}>Historique des opérations récentes</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webLimit,
            { paddingBottom: isWeb ? 32 : 96 + bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTransactions(true)}
              colors={['#00687a']}
              tintColor="#00687a"
            />
          }
        >
          {/* Carte résumé */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Reçus (30 j)</Text>
              <Text style={[styles.summaryValue, styles.summaryIn]}>
                {loading ? '—' : `+${totals.in.toLocaleString('fr-FR')} FCFA`}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Envoyés (30 j)</Text>
              <Text style={[styles.summaryValue, styles.summaryOut]}>
                {loading ? '—' : `−${totals.out.toLocaleString('fr-FR')} FCFA`}
              </Text>
            </View>
          </View>

          {/* Filtres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {renderContent()}
        </ScrollView>

        {!isWeb && (
          <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.replace('/dashboard' as never)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.85}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color="#00424f" />
                <Text style={[styles.navLabel, styles.navLabelActive]}>Transfer</Text>
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
                onPress={() => router.replace('/profile' as never)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account-outline" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5fafc' },
  screen: { flex: 1, backgroundColor: '#f5fafc' },
  webLimit: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
    paddingVertical: 10,
  },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  summaryValue: { marginTop: 6, fontSize: 16, fontWeight: '800' },
  summaryIn: { color: '#FFFFFF' },
  summaryOut: { color: 'rgba(255,255,255,0.9)' },
  filterScroll: { marginHorizontal: -4 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dee3e6',
  },
  filterChipActive: { backgroundColor: '#6cf8bb', borderColor: '#6cf8bb' },
  filterChipText: { color: '#3d494c', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#00424f', fontWeight: '700' },
  section: { gap: 8 },
  sectionDate: {
    color: '#6d797d',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    overflow: 'hidden',
  },
  transferRow: { flexDirection: 'row', padding: 14, alignItems: 'flex-start', gap: 12 },
  transferIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBody: { flex: 1 },
  transferTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  transferLabel: { flex: 1, color: '#171d1e', fontSize: 14, fontWeight: '700' },
  transferAmount: { fontSize: 13, fontWeight: '800' },
  amountIn: { color: '#10B981' },
  amountOut: { color: '#171d1e' },
  transferSubtitle: { color: '#6d797d', fontSize: 12, marginTop: 2 },
  transferMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  transferMetaText: { flex: 1, color: '#94a3b8', fontSize: 10 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  statusCompleted: { backgroundColor: '#d1fae5' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusFailed: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  statusTextCompleted: { color: '#065f46' },
  statusTextPending: { color: '#92400e' },
  statusTextFailed: { color: '#991b1b' },
  rowDivider: { height: 1, backgroundColor: '#eff4f7', marginLeft: 70 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { color: '#171d1e', fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: '#6d797d', fontSize: 13, textAlign: 'center' },
  loadingContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: '#6d797d', fontSize: 13 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#00687a',
    borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
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

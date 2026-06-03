import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
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

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  timeLabel: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await api.get('/auth/notifications/');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger vos notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => {
          if (n.id === id && !n.is_read) {
            setUnreadCount(count => Math.max(0, count - 1));
            return { ...n, is_read: true };
          }
          return n;
        })
      );
      await api.post(`/auth/notifications/${id}/read/`);
    } catch (err) {
      console.error(err);
      // Revert if error (optional, simple app reload is fine)
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // Perform updates concurrently
      await Promise.all(unread.map(n => api.post(`/auth/notifications/${n.id}/read/`)));
    } catch (err) {
      console.error(err);
      fetchNotifications();
    }
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer as any}>
          <ActivityIndicator size="large" color="#00687a" />
          <Text style={styles.loadingText}>Chargement de vos notifications…</Text>
        </div>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#dee3e6" />
          <Text style={styles.emptyTitle}>Erreur de connexion</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchNotifications()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-outline" size={48} color="#dee3e6" />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptySubtitle}>Vous êtes à jour ! Vos futures alertes et annonces s'afficheront ici.</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {notifications.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, !item.is_read && styles.unreadCard]}
              onPress={() => handleMarkAsRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  {!item.is_read && <View style={styles.unreadDot} />}
                  <Text style={[styles.cardTitle, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
                </View>
                <Text style={styles.cardTime}>{item.timeLabel}</Text>
              </View>
              <Text style={styles.cardContent}>{item.content}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isWeb && styles.webWidthLimit]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => safeGoBack(router, '/dashboard')}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color="#006c49" />
              </TouchableOpacity>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={styles.headerSubtitle}>{unreadCount} non lue(s)</Text>
                )}
              </View>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.readAllBtn}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-sharp" size={18} color="#006c49" />
                <Text style={styles.readAllText}>Tout lire</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Scroll */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webWidthLimit,
            { paddingBottom: 24 + bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} colors={['#006c49']} />
          }
        >
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#f1f6f9' },
  webWidthLimit: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#dee3e6',
    paddingVertical: 10,
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#00424f',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff4f7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  readAllText: {
    color: '#006c49',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    display: 'flex',
  },
  loadingText: {
    color: '#6d797d',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00424f',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6d797d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#006c49',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  unreadCard: {
    borderColor: '#006c4933',
    backgroundColor: '#006c4905',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006c49',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6d797d',
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#00424f',
  },
  cardTime: {
    fontSize: 10,
    color: '#a0aec0',
    fontWeight: '600',
  },
  cardContent: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 18,
    fontWeight: '500',
  },
});

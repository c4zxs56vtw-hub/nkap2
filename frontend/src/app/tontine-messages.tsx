import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  MY_TONTINES,
  getTontineChatSummary,
  type MyTontine,
} from '../services/tontineChatService';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';

type ChatRow = MyTontine & { preview: string; time: string };

export default function TontineMessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const summaries = await Promise.all(
      MY_TONTINES.map(async (t) => {
        const { preview, time } = await getTontineChatSummary(t.id);
        return { ...t, preview, time };
      })
    );
    setRows(summaries);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRows();
    }, [loadRows])
  );

  const openChat = (t: MyTontine) => {
    router.push({
      pathname: '/tontine-chat',
      params: {
        id: t.id,
        title: t.title,
        amount: t.poolAmount,
        members: String(t.activeMembers),
      },
    } as never);
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={[styles.headerInner, isWeb && styles.webLimit]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router)} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={24} color="#00687a" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Messagerie de groupe</Text>
              <Text style={styles.headerSubtitle}>
                Discussions entre membres de vos tontines
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webLimit,
            { paddingBottom: isWeb ? bottomPadding + 24 : 96 + bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#00687a" />
            <Text style={styles.infoBannerText}>
              Chaque tontine possède son salon privé : seuls les membres inscrits y participent.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#10B981" />
              <Text style={styles.loadingText}>Chargement des discussions...</Text>
            </View>
          ) : (
            rows.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.chatRow}
                activeOpacity={0.85}
                onPress={() => openChat(t)}
              >
                <View style={[styles.chatIcon, { backgroundColor: t.iconBg }]}>
                  <MaterialCommunityIcons name={t.icon} size={24} color={t.iconColor} />
                </View>
                <View style={styles.chatBody}>
                  <View style={styles.chatTopLine}>
                    <Text style={styles.chatTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    {t.time ? <Text style={styles.chatTime}>{t.time}</Text> : null}
                  </View>
                  <Text style={styles.chatSubtitle} numberOfLines={1}>
                    {t.subtitle} · {t.activeMembers} membres actifs
                  </Text>
                  <Text style={styles.chatPreview} numberOfLines={2}>
                    {t.preview}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#6d797d" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {!isWeb && (
          <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.replace('/dashboard' as never)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.replace('/transfers' as never)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={24} color="#3d494c" />
                <Text style={styles.navLabel}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.85}>
                <MaterialCommunityIcons name="forum-outline" size={24} color="#00424f" />
                <Text style={[styles.navLabel, styles.navLabelActive]}>Messagerie</Text>
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
  scrollContent: { padding: 16, gap: 12 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    marginBottom: 4,
  },
  infoBannerText: { flex: 1, color: '#00687a', fontSize: 12, lineHeight: 17, fontWeight: '500' },
  loadingBox: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  loadingText: { color: '#6d797d', fontSize: 13 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 14,
    gap: 12,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: { flex: 1 },
  chatTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chatTitle: { flex: 1, color: '#171d1e', fontSize: 15, fontWeight: '700' },
  chatTime: { color: '#6d797d', fontSize: 10, fontWeight: '600' },
  chatSubtitle: { color: '#6d797d', fontSize: 11, marginTop: 2 },
  chatPreview: { color: '#475569', fontSize: 13, marginTop: 6, lineHeight: 18 },
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

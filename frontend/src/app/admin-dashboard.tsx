import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ADMIN_MODE_KEY } from './profile';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';

// Mock list of users in the system
interface UserItem {
  id: string;
  name: string;
  avatarColor: string;
  kycStatus: 'VÉRIFIÉ' | 'EN ATTENTE' | 'NON DÉPOSÉ';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  phone: string;
  tontinesCount: number;
}

const INITIAL_USERS: UserItem[] = [
  {
    id: 'user-current',
    name: 'Moi (Utilisateur Actuel)',
    avatarColor: '#10B981',
    kycStatus: 'EN ATTENTE',
    lastMessage: 'Bonjour, j’ai envoyé mes documents il y a 2 jours.',
    lastMessageTime: '10:04',
    unreadCount: 1,
    phone: '+237 699 887 766',
    tontinesCount: 3,
  },
  {
    id: 'user-2',
    name: 'Sarah Douala',
    avatarColor: '#db2777',
    kycStatus: 'VÉRIFIÉ',
    lastMessage: 'Reçu de versement de 150 000 FCFA envoyé pour Voyage 2024.',
    lastMessageTime: '09:45',
    unreadCount: 0,
    phone: '+237 677 554 433',
    tontinesCount: 5,
  },
  {
    id: 'user-3',
    name: "Marc N'diaye",
    avatarColor: '#6366f1',
    kycStatus: 'VÉRIFIÉ',
    lastMessage: 'Calendrier des enchères disponible pour validation.',
    lastMessageTime: '09:42',
    unreadCount: 0,
    phone: '+221 77 123 45 67',
    tontinesCount: 2,
  },
  {
    id: 'user-4',
    name: 'Marie Ngo',
    avatarColor: '#f59e0b',
    kycStatus: 'NON DÉPOSÉ',
    lastMessage: 'Comment puis-je lier mon compte Orange Money ?',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    phone: '+237 655 443 322',
    tontinesCount: 1,
  },
];

interface ChatMsg {
  id: string;
  content: string;
  isAdmin: boolean;
  time: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isDesktop } = useResponsive();

  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [chatHistory, setChatHistory] = useState<{ [userId: string]: ChatMsg[] }>({});
  const [adminReplyText, setAdminReplyText] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [status, adminMode] = await Promise.all([
          SecureStore.getItemAsync('user_status'),
          SecureStore.getItemAsync(ADMIN_MODE_KEY),
        ]);
        if (adminMode !== 'true') {
          Alert.alert(
            'Mode administrateur requis',
            'Activez le « Mode Administrateur » dans Profil → Assistance & Rôles pour accéder au portail.',
            [{ text: 'Retour', onPress: () => safeGoBack(router, '/profile') }]
          );
          return;
        }
        if (status) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === 'user-current'
                ? { ...u, kycStatus: status as 'VÉRIFIÉ' | 'EN ATTENTE' | 'NON DÉPOSÉ' }
                : u
            )
          );
        }
      } catch {
        safeGoBack(router, '/profile');
      }
    };
    init();
  }, [router]);

  const handleSelectUser = (user: UserItem) => {
    setSelectedUser(user);
    // Mark as read
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, unreadCount: 0 } : u))
    );

    // Initialize chat if empty
    if (!chatHistory[user.id]) {
      setChatHistory((prev) => ({
        ...prev,
        [user.id]: [
          {
            id: '1',
            content: user.lastMessage,
            isAdmin: false,
            time: user.lastMessageTime,
          },
        ],
      }));
    }
  };

  const handleSendAdminReply = () => {
    if (!selectedUser || !adminReplyText.trim()) return;

    const newMsg: ChatMsg = {
      id: Date.now().toString(),
      content: adminReplyText,
      isAdmin: true,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg],
    }));

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, lastMessage: adminReplyText, lastMessageTime: 'A l’instant' } : u
      )
    );

    setAdminReplyText('');

    // Trigger mock user response after 1.5s
    setTimeout(() => {
      const userResponses: { [name: string]: string } = {
        'Moi (Utilisateur Actuel)': 'Génial ! Merci beaucoup pour votre réactivité, c’est parfait.',
        'Sarah Douala': 'Merci pour la confirmation. Je surveille le prochain tour.',
        "Marc N'diaye": 'Entendu, je mets à jour le calendrier de mon côté.',
        'Marie Ngo': 'Merci, je vais essayer d’enregistrer mon numéro Orange Money tout de suite.',
      };

      const userReply: ChatMsg = {
        id: `reply-${Date.now()}`,
        content: userResponses[selectedUser.name] || 'Merci pour votre retour rapide !',
        isAdmin: false,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), userReply],
      }));

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, lastMessage: userReply.content, lastMessageTime: 'A l’instant' }
            : u
        )
      );
    }, 1500);
  };

  const handleValidateKYC = async (user: UserItem) => {
    setLoading(true);
    // Simulate API request
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, kycStatus: 'VÉRIFIÉ' } : u))
    );

    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser({ ...selectedUser, kycStatus: 'VÉRIFIÉ' });
    }

    // If validating the current user, persist in SecureStore
    if (user.id === 'user-current') {
      try {
        await SecureStore.setItemAsync('user_status', 'VÉRIFIÉ');
      } catch {
        // ignore
      }
    }

    Alert.alert(
      'KYC Validé 🛡️',
      `Le dossier KYC de ${user.name} a été validé avec succès. L’utilisateur a été notifié par message système.`
    );

    // Push system message in chat
    const sysMsg: ChatMsg = {
      id: `sys-${Date.now()}`,
      content: '🔧 Statut KYC mis à jour à : VÉRIFIÉ par l’administration.',
      isAdmin: true,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [user.id]: [...(prev[user.id] || []), sysMsg],
    }));
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;

    Alert.alert(
      'Annonce Diffusée 📢',
      `Votre message : "${broadcastText}" a été diffusé avec succès dans les canaux de discussion généraux de toutes les tontines.`,
      [{ text: 'Super !' }]
    );
    setBroadcastText('');
  };

  const pendingKYCCount = users.filter((u) => u.kycStatus === 'EN ATTENTE').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isWeb && styles.webWidthLimit]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => safeGoBack(router, '/profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color="#db2777" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Portail Administration</Text>
                <Text style={styles.headerSubtitle}>Modération & Assistance Nkap</Text>
              </View>
            </View>

            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Content */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, isWeb && styles.webWidthLimit]}>
            {/* Quick Metrics Grid */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Utilisateurs</Text>
                <Text style={styles.metricValue}>{users.length}</Text>
              </View>
              <View style={[styles.metricCard, { borderColor: '#db277733' }]}>
                <Text style={[styles.metricLabel, { color: '#db2777' }]}>KYC en attente</Text>
                <Text style={[styles.metricValue, { color: '#db2777' }]}>{pendingKYCCount}</Text>
              </View>
              <View style={[styles.metricCard, { borderColor: '#10b98133' }]}>
                <Text style={[styles.metricLabel, { color: '#10b981' }]}>Actifs</Text>
                <Text style={[styles.metricValue, { color: '#10b981' }]}>100%</Text>
              </View>
            </View>

            {/* Broadcast Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📢 Message de Diffusion Globale</Text>
              <Text style={styles.cardSubtitle}>
                Envoyez un message système officiel visible par tous les utilisateurs de l'application Nkap.
              </Text>
              <View style={styles.broadcastInputContainer}>
                <TextInput
                  style={styles.broadcastInput}
                  placeholder="Ex: Maintenance programmée ce soir à 22h..."
                  placeholderTextColor="#a0aec0"
                  value={broadcastText}
                  onChangeText={setBroadcastText}
                />
                <TouchableOpacity
                  style={[styles.broadcastBtn, !broadcastText.trim() && styles.broadcastBtnDisabled]}
                  onPress={handleBroadcast}
                  disabled={!broadcastText.trim()}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.broadcastBtnText}>Diffuser</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Layout divided in list and chat preview */}
            <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
              {/* User List Pane */}
              <View style={[styles.pane, isDesktop && { flex: 1.2 }]}>
                <Text style={styles.sectionTitle}>Tickets d'assistance et KYC</Text>
                <View style={styles.userList}>
                  {users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.userRow, isSelected && styles.userRowSelected]}
                        onPress={() => handleSelectUser(user)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.userAvatar, { backgroundColor: user.avatarColor }]}>
                          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <View style={styles.userTopLine}>
                            <Text style={styles.userName} numberOfLines={1}>
                              {user.name}
                            </Text>
                            <Text style={styles.userTime}>{user.lastMessageTime}</Text>
                          </View>
                          <Text style={styles.lastMsgText} numberOfLines={1}>
                            {user.lastMessage}
                          </Text>
                          <View style={styles.userMetaLine}>
                            <View
                              style={[
                                styles.kycBadge,
                                user.kycStatus === 'VÉRIFIÉ' && styles.kycVerified,
                                user.kycStatus === 'EN ATTENTE' && styles.kycPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.kycText,
                                  user.kycStatus === 'VÉRIFIÉ' && styles.kycVerifiedText,
                                  user.kycStatus === 'EN ATTENTE' && styles.kycPendingText,
                                ]}
                              >
                                KYC: {user.kycStatus}
                              </Text>
                            </View>
                            <Text style={styles.userTontines}>
                              {user.tontinesCount} tontine{user.tontinesCount > 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        {user.unreadCount > 0 && <View style={styles.unreadBadge} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Chat Pane */}
              {selectedUser ? (
                <View style={[styles.pane, styles.chatPane, isDesktop && { flex: 1.8 }]}>
                  {/* Selected User Header */}
                  <View style={styles.chatPaneHeader}>
                    <View style={styles.chatPaneHeaderLeft}>
                      <Text style={styles.chatPaneTitle}>{selectedUser.name}</Text>
                      <Text style={styles.chatPanePhone}>{selectedUser.phone}</Text>
                    </View>

                    {/* Quick KYC Validation Button */}
                    {selectedUser.kycStatus !== 'VÉRIFIÉ' && (
                      <TouchableOpacity
                        style={styles.validateKycBtn}
                        onPress={() => handleValidateKYC(selectedUser)}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                            <Text style={styles.validateKycBtnText}>Valider KYC</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Chat messages inside Admin Dashboard */}
                  <ScrollView
                    style={styles.paneMessagesScroll}
                    contentContainerStyle={styles.paneMessagesContent}
                  >
                    {(chatHistory[selectedUser.id] || []).map((msg) => {
                      if (msg.content.startsWith('🔧')) {
                        return (
                          <View key={msg.id} style={styles.paneSystemMsgWrap}>
                            <Text style={styles.paneSystemMsgText}>{msg.content}</Text>
                          </View>
                        );
                      }

                      return (
                        <View
                          key={msg.id}
                          style={[
                            styles.paneMsgWrap,
                            msg.isAdmin ? styles.paneMsgAdminWrap : styles.paneMsgUserWrap,
                          ]}
                        >
                          <View
                            style={[
                              styles.paneMsgCard,
                              msg.isAdmin ? styles.paneMsgAdminCard : styles.paneMsgUserCard,
                            ]}
                          >
                            <Text
                              style={[
                                styles.paneMsgText,
                                msg.isAdmin ? styles.paneMsgAdminText : styles.paneMsgUserText,
                              ]}
                            >
                              {msg.content}
                            </Text>
                            <Text
                              style={[
                                styles.paneMsgTime,
                                msg.isAdmin ? styles.paneMsgAdminTime : styles.paneMsgUserTime,
                              ]}
                            >
                              {msg.time}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  {/* Admin input area */}
                  <View style={styles.paneInputArea}>
                    <TextInput
                      style={styles.paneTextInput}
                      placeholder="Répondre à cet utilisateur..."
                      placeholderTextColor="#a0aec0"
                      value={adminReplyText}
                      onChangeText={setAdminReplyText}
                      onSubmitEditing={handleSendAdminReply}
                    />
                    <TouchableOpacity
                      style={[styles.paneSendBtn, !adminReplyText.trim() && styles.paneSendBtnDisabled]}
                      onPress={handleSendAdminReply}
                      disabled={!adminReplyText.trim()}
                    >
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.pane, styles.chatPaneEmpty]}>
                  <MaterialCommunityIcons name="face-agent" size={48} color="#dee3e6" />
                  <Text style={styles.chatEmptyText}>Sélectionnez un ticket pour entamer la discussion</Text>
                  <Text style={styles.chatEmptySubtitle}>
                    Vous pourrez répondre aux questions et valider son dossier KYC.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#fdf2f8' },
  webWidthLimit: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#fbcfe8',
    paddingVertical: 12,
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
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#9d174d',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6d797d',
    fontSize: 11,
    marginTop: 2,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#db27771a',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  adminBadgeText: {
    color: '#db2777',
    fontSize: 10,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 12,
  },
  metricLabel: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#1c2426',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 16,
  },
  cardTitle: {
    color: '#1c2426',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#6d797d',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  broadcastInputContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  broadcastInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 40,
    color: '#0f172a',
    fontSize: 13,
  },
  broadcastBtn: {
    backgroundColor: '#db2777',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mainLayout: {
    gap: 16,
  },
  desktopLayout: {
    flexDirection: 'row',
    minHeight: 480,
  },
  pane: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee3e6',
    padding: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  userList: {
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#eff4f8',
    alignItems: 'center',
  },
  userRowSelected: {
    backgroundColor: '#fce7f3',
    borderColor: '#fbcfe8',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  userTime: {
    color: '#64748b',
    fontSize: 10,
  },
  lastMsgText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  userMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  kycBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  kycVerified: {
    backgroundColor: '#d1fae5',
  },
  kycPending: {
    backgroundColor: '#fef3c7',
  },
  kycText: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },
  kycVerifiedText: {
    color: '#065f46',
  },
  kycPendingText: {
    color: '#92400e',
  },
  userTontines: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#db2777',
    marginLeft: 8,
  },
  chatPane: {
    flex: 1.5,
    minHeight: 380,
  },
  chatPaneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  chatPaneHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  chatPaneTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  chatPanePhone: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  validateKycBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#db2777',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  validateKycBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  paneMessagesScroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  paneMessagesContent: {
    paddingBottom: 16,
  },
  paneSystemMsgWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  paneSystemMsgText: {
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  paneMsgWrap: {
    width: '100%',
    marginVertical: 4,
  },
  paneMsgAdminWrap: {
    alignItems: 'flex-end',
  },
  paneMsgUserWrap: {
    alignItems: 'flex-start',
  },
  paneMsgCard: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '85%',
  },
  paneMsgAdminCard: {
    backgroundColor: '#db2777',
    borderTopRightRadius: 2,
  },
  paneMsgUserCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderTopLeftRadius: 2,
  },
  paneMsgText: {
    fontSize: 13,
    lineHeight: 17,
  },
  paneMsgAdminText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  paneMsgUserText: {
    color: '#0f172a',
    fontWeight: '500',
  },
  paneMsgTime: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  paneMsgAdminTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  paneMsgUserTime: {
    color: '#64748b',
  },
  paneInputArea: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
    alignItems: 'center',
  },
  paneTextInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 36,
    color: '#0f172a',
    fontSize: 13,
  },
  paneSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paneSendBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  chatPaneEmpty: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 10,
    minHeight: 380,
  },
  chatEmptyText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  chatEmptySubtitle: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
});

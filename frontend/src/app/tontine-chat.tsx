import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import {
  getTontineById,
  loadTontineMessages,
  saveTontineMessages,
  type TontineChatMessage,
} from '../services/tontineChatService';

export default function TontineChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();

  const tontineId = (params.id as string) || 'voyage-2024';
  const tontine = getTontineById(tontineId);
  const tontineTitle = (params.title as string) || tontine?.title || 'Voyage 2024';
  const tontineAmount = (params.amount as string) || tontine?.poolAmount || '1 250 000 FCFA';
  const activeMembers = Number(params.members) || tontine?.activeMembers || 8;
  const treasurerName = tontine?.treasurerName ?? 'Sarah Douala';
  const memberName = tontine?.memberName ?? "Marc N'diaye";

  const [messages, setMessages] = useState<TontineChatMessage[]>([]);
  const [chatReady, setChatReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const loaded = await loadTontineMessages(tontineId);
      if (active) {
        setMessages(loaded);
        setChatReady(true);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [tontineId]);

  useEffect(() => {
    if (!chatReady || messages.length === 0) return;
    saveTontineMessages(tontineId, messages);
  }, [messages, chatReady, tontineId]);

  // Auto-scroll to bottom when messages or typing status changes
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: TontineChatMessage = {
      id: Date.now().toString(),
      content: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'text',
      status: 'read',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Trigger simulated replies
    simulateResponses(inputText);
  };

  // Bot responses based on user input
  const simulateResponses = (text: string) => {
    const textLower = text.toLowerCase();

    // 1. Respond as Sarah Douala
    if (textLower.includes('argent') || textLower.includes('envoyé') || textLower.includes('payé') || textLower.includes('momo') || textLower.includes('versement')) {
      setIsTyping(treasurerName);
      setTimeout(() => {
        setIsTyping(null);
        const newMsg: TontineChatMessage = {
          id: `sarah-${Date.now()}`,
          senderName: treasurerName,
          senderRole: 'TRÉSORIER',
          content: 'C’est parfait ! C’est bien reçu et enregistré. Merci pour ton versement rapide ! 👍🏽',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text',
        };
        setMessages((prev) => [...prev, newMsg]);

        // Auto trigger system confirmation 2s later
        setTimeout(() => {
          const sysMsg: TontineChatMessage = {
            id: `sys-${Date.now()}`,
            content: 'Versement de 150 000 FCFA validé par le système.',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
            type: 'system',
          };
          setMessages((prev) => [...prev, sysMsg]);
        }, 1500);

      }, 2000);
    }
    // 2. Respond as Marc N'diaye
    else if (
      textLower.includes('voyage') ||
      textLower.includes('billet') ||
      textLower.includes('avion') ||
      textLower.includes('weekend') ||
      textLower.includes('vacances') ||
      textLower.includes('scolar') ||
      textLower.includes('école')
    ) {
      setIsTyping(memberName);
      setTimeout(() => {
        setIsTyping(null);
        const newMsg: TontineChatMessage = {
          id: `marc-${Date.now()}`,
          senderName: memberName,
          senderRole: 'MEMBRE',
          content: 'Carrément ! Moi je regarde déjà les vols de nuit, c’est souvent moins cher et plus pratique.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text',
        };
        setMessages((prev) => [...prev, newMsg]);
      }, 2500);
    }
    // 3. Generic greetings
    else {
      setIsTyping(treasurerName);
      setTimeout(() => {
        setIsTyping(null);
        const newMsg: TontineChatMessage = {
          id: `sarah-${Date.now()}`,
          senderName: treasurerName,
          senderRole: 'TRÉSORIER',
          content: 'Salut ! J’espère que tout se passe bien de ton côté. On avance super bien sur cette tontine ! 🙌',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text',
        };
        setMessages((prev) => [...prev, newMsg]);
      }, 2000);
    }
  };

  // Simulation helpers for the Simulation Panel
  const handleSimulateImageSend = () => {
    const imgMsg: TontineChatMessage = {
      id: `me-img-${Date.now()}`,
      content: undefined,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=500&auto=format&fit=crop&q=60',
      status: 'read',
    };
    setMessages((prev) => [...prev, imgMsg]);
    setTimeout(() => triggerSimulation('sarah_image'), 1200);
  };

  const triggerSimulation = (type: 'system_payment' | 'sarah_image' | 'marc_message' | 'admin_broadcast') => {
    setShowSimPanel(false);

    if (type === 'system_payment') {
      const sysMsg: TontineChatMessage = {
        id: `sys-sim-${Date.now()}`,
        content: 'Versement de 150 000 FCFA validé par le système.',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        type: 'system',
      };
      setMessages((prev) => [...prev, sysMsg]);
    } else if (type === 'sarah_image') {
      const imgMsg: TontineChatMessage = {
        id: `sarah-img-sim-${Date.now()}`,
        senderName: treasurerName,
        senderRole: 'TRÉSORIER',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      };
      setMessages((prev) => [...prev, imgMsg]);
    } else if (type === 'marc_message') {
      setIsTyping(memberName);
      setTimeout(() => {
        setIsTyping(null);
        const txtMsg: TontineChatMessage = {
          id: `marc-txt-sim-${Date.now()}`,
          senderName: memberName,
          senderRole: 'MEMBRE',
          content: 'Confirmé pour ma part ! Je participe bien au prochain tour. On se tient au courant pour les billets. ✈️',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text',
        };
        setMessages((prev) => [...prev, txtMsg]);
      }, 1000);
    } else if (type === 'admin_broadcast') {
      const adminMsg: TontineChatMessage = {
        id: `admin-sim-${Date.now()}`,
        senderName: 'Support Nkap',
        senderRole: 'ADMIN',
        content: '📢 Message officiel : Une maintenance programmée de la plateforme aura lieu ce dimanche à 22h. Les transactions de tontines resteront sécurisées.',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        type: 'text',
      };
      setMessages((prev) => [...prev, adminMsg]);
    }
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.screen}>
          {/* ── TOP HEADER BAR ── */}
          <View style={styles.header}>
            <View style={[styles.headerInner, isWeb && styles.webWidthLimit]}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => safeGoBack(router)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={24} color="#00687a" />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{tontineTitle}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{activeMembers} membres actifs</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRight}>
                {/* Cagnotte badge */}
                <View style={styles.cagnotteBadge}>
                  <MaterialCommunityIcons name="wallet-outline" size={16} color="#00687a" style={styles.cagnotteIcon} />
                  <Text style={styles.cagnotteAmount}>{tontineAmount}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── MESSAGES LIST ── */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={[
              styles.messagesContainer,
              isWeb && styles.webWidthLimit,
              { paddingBottom: 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {!chatReady ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#10B981" size="large" />
                <Text style={styles.loadingText}>Chargement de la discussion...</Text>
              </View>
            ) : (
              <>
            <View style={styles.dateSeparator}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>Aujourd'hui</Text>
              </View>
            </View>

            {messages.map((msg) => {
              // 1. Render system message
              if (msg.type === 'system') {
                return (
                  <View key={msg.id} style={styles.systemMsgWrap}>
                    <View style={styles.systemMsgCard}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                      <Text style={styles.systemMsgText}>{msg.content}</Text>
                    </View>
                  </View>
                );
              }

              // 2. Render outgoing message (Current User)
              if (msg.isMe) {
                if (msg.type === 'image' && msg.imageUrl) {
                  return (
                    <View key={msg.id} style={styles.myMsgWrap}>
                      <View style={styles.myImageCard}>
                        <Image source={{ uri: msg.imageUrl }} style={styles.msgImage} resizeMode="cover" />
                        <View style={styles.myMsgFooter}>
                          <Text style={styles.myMsgTime}>{msg.timestamp}</Text>
                          <MaterialCommunityIcons name="check-all" size={16} color="#4ade80" />
                        </View>
                      </View>
                    </View>
                  );
                }
                return (
                  <View key={msg.id} style={styles.myMsgWrap}>
                    <View style={styles.myMsgCard}>
                      <Text style={styles.myMsgText}>{msg.content}</Text>
                      <View style={styles.myMsgFooter}>
                        <Text style={styles.myMsgTime}>{msg.timestamp}</Text>
                        <MaterialCommunityIcons name="check-all" size={16} color="#4ade80" />
                      </View>
                    </View>
                  </View>
                );
              }

              // 3. Render incoming message (Other members / Admin)
              return (
                <View key={msg.id} style={styles.otherMsgWrap}>
                  <View style={styles.otherMsgMeta}>
                    <Text style={styles.senderName}>{msg.senderName}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        msg.senderRole === 'TRÉSORIER' && styles.roleTresorier,
                        msg.senderRole === 'MEMBRE' && styles.roleMembre,
                        msg.senderRole === 'ADMIN' && styles.roleAdmin,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          msg.senderRole === 'TRÉSORIER' && styles.roleTresorierText,
                          msg.senderRole === 'MEMBRE' && styles.roleMembreText,
                          msg.senderRole === 'ADMIN' && styles.roleAdminText,
                        ]}
                      >
                        {msg.senderRole}
                      </Text>
                    </View>
                  </View>

                  {msg.type === 'image' ? (
                    <View style={styles.imageCard}>
                      <Image
                        source={{ uri: msg.imageUrl }}
                        style={styles.msgImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.imageTime}>{msg.timestamp}</Text>
                    </View>
                  ) : (
                    <View style={styles.otherMsgCard}>
                      <Text style={styles.otherMsgText}>{msg.content}</Text>
                      <Text style={styles.otherMsgTime}>{msg.timestamp}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={styles.otherMsgWrap}>
                <View style={styles.otherMsgMeta}>
                  <Text style={styles.senderName}>{isTyping}</Text>
                </View>
                <View style={styles.typingCard}>
                  <ActivityIndicator size="small" color="#6d797d" />
                  <Text style={styles.typingText}>en train d'écrire...</Text>
                </View>
              </View>
            )}
              </>
            )}
          </ScrollView>

          {/* ── BOTTOM INPUT BAR ── */}
          <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
            <View style={[styles.bottomBarInner, isWeb && styles.webWidthLimit]}>
              <TouchableOpacity style={styles.attachmentBtn} activeOpacity={0.8} onPress={handleSimulateImageSend}>
                <Ionicons name="add" size={24} color="#6d797d" />
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Écrire un message..."
                  placeholderTextColor="#a0aec0"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8} onPress={handleSimulateImageSend}>
                  <Ionicons name="camera-outline" size={20} color="#6d797d" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu flottant discret — déclencheurs de test */}
          <TouchableOpacity
            style={[styles.floatingSimBtn, { bottom: bottomPadding + (isWeb ? 72 : 128) }]}
            onPress={() => setShowSimPanel(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="flask-outline" size={22} color="#00687a" />
          </TouchableOpacity>

          {/* Barre de navigation — mobile (maquette) */}
          {!isWeb && (
            <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
              <View style={styles.navRow}>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/dashboard' as never)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="home-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Accueil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.85}>
                <View style={styles.navIconActive}>
                  <MaterialCommunityIcons name="account-group" size={22} color="#00424f" />
                </View>
                <Text style={[styles.navLabel, styles.navLabelActive]}>Tontines</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
                <MaterialCommunityIcons name="chart-line" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Bourse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/profile' as never)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#3d494c" />
                <Text style={styles.navLabel}>Profil</Text>
              </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── SIMULATION PANEL MODAL ── */}
          <Modal
            visible={showSimPanel}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSimPanel(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowSimPanel(false)}
            >
              <View style={[styles.modalSheet, isWeb && styles.modalSheetWeb]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Déclencheurs de test</Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setShowSimPanel(false)}
                  >
                    <Ionicons name="close" size={20} color="#3d494c" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Déclenchez des actions fictives pour valider les différents aspects visuels et fonctionnels du chat :
                </Text>

                <View style={styles.simButtonsGroup}>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => triggerSimulation('system_payment')}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <View style={styles.simBtnTextContainer}>
                      <Text style={styles.simBtnTitle}>Simuler un versement validé</Text>
                      <Text style={styles.simBtnDesc}>Injecte un bandeau de validation système vert menthe</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => triggerSimulation('sarah_image')}
                  >
                    <Ionicons name="image" size={20} color="#06b6d4" />
                    <View style={styles.simBtnTextContainer}>
                      <Text style={styles.simBtnTitle}>Sarah envoie une image</Text>
                      <Text style={styles.simBtnDesc}>Simule l'envoi d'une photo par la trésorière</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => triggerSimulation('marc_message')}
                  >
                    <Ionicons name="chatbubble" size={20} color="#6366f1" />
                    <View style={styles.simBtnTextContainer}>
                      <Text style={styles.simBtnTitle}>Marc envoie une question</Text>
                      <Text style={styles.simBtnDesc}>Simule la saisie et le message de Marc N'diaye</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => triggerSimulation('admin_broadcast')}
                  >
                    <Ionicons name="megaphone" size={20} color="#db2777" />
                    <View style={styles.simBtnTextContainer}>
                      <Text style={styles.simBtnTitle}>Diffusion globale Admin</Text>
                      <Text style={styles.simBtnDesc}>Simule un message de l'administrateur Nkap</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoid: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#f3f7f9' },
  webWidthLimit: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  /* Header Styles */
  header: {
    width: '100%',
    backgroundColor: '#f0faf9',
    borderBottomWidth: 1,
    borderBottomColor: '#d4ebe8',
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
    flex: 1,
    gap: 8,
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
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    color: '#00424f',
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#6d797d',
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cagnotteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  cagnotteIcon: {
    marginRight: 4,
  },
  cagnotteAmount: {
    color: '#00687a',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingSimBtn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#b2ebf2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#00424f',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  /* Messages Scroll */
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { color: '#6d797d', fontSize: 13 },
  /* Separator */
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  /* System Messages */
  systemMsgWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMsgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f9f0',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    maxWidth: '95%',
  },
  systemMsgText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  /* Outgoing Messages (Me) */
  myMsgWrap: {
    width: '100%',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  myMsgCard: {
    backgroundColor: '#004d40',
    borderRadius: 16,
    borderTopRightRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '82%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  myMsgText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  myMsgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  myMsgTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontStyle: 'italic',
  },
  myImageCard: {
    borderRadius: 16,
    borderTopRightRadius: 2,
    backgroundColor: '#004d40',
    padding: 4,
    maxWidth: '82%',
    overflow: 'hidden',
  },
  /* Incoming Messages (Others) */
  otherMsgWrap: {
    width: '100%',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  otherMsgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  senderName: {
    color: '#171d1e',
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  roleBadgeText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  roleTresorier: {
    backgroundColor: '#db2777',
  },
  roleTresorierText: {
    color: '#FFFFFF',
  },
  roleMembre: {
    backgroundColor: '#e2e8f0',
  },
  roleMembreText: {
    color: '#475569',
  },
  roleAdmin: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fbcfe8',
    borderWidth: 1,
  },
  roleAdminText: {
    color: '#db2777',
  },
  otherMsgCard: {
    backgroundColor: '#eff4f7',
    borderRadius: 16,
    borderTopLeftRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '82%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  otherMsgText: {
    color: '#171d1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  otherMsgTime: {
    color: '#6d797d',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  /* Image Messages */
  imageCard: {
    borderRadius: 16,
    borderTopLeftRadius: 2,
    backgroundColor: '#eff4f7',
    padding: 4,
    maxWidth: '82%',
    overflow: 'hidden',
  },
  msgImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
  },
  imageTime: {
    color: '#6d797d',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    marginRight: 6,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  /* Typing Box */
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4f7',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  typingText: {
    color: '#6d797d',
    fontSize: 12,
    fontStyle: 'italic',
  },
  /* Bottom Input Bar */
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#dee3e6',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4f7',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 40,
  },
  textInput: {
    flex: 1,
    color: '#171d1e',
    fontSize: 14,
    padding: 0,
    height: '100%',
  },
  cameraBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#004d40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#a0aec0',
    opacity: 0.6,
  },
  /* Modal Overlay */
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
  },
  modalSheetWeb: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#00424f',
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    color: '#6d797d',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  simButtonsGroup: {
    gap: 12,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4f7',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#dee3e6',
  },
  simBtnTextContainer: {
    flex: 1,
  },
  simBtnTitle: {
    color: '#171d1e',
    fontSize: 14,
    fontWeight: '700',
  },
  simBtnDesc: {
    color: '#6d797d',
    fontSize: 11,
    marginTop: 2,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#dee3e6',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navItemActive: {},
  navIconActive: {
    backgroundColor: '#6cf8bb',
    borderRadius: 999,
    padding: 8,
    marginBottom: 2,
  },
  navLabel: {
    marginTop: 2,
    color: '#3d494c',
    fontSize: 10,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#00424f',
    fontWeight: '700',
  },
});

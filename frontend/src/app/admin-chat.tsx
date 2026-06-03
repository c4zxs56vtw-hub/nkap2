import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useResponsive } from '../hooks/use-responsive';
import { safeGoBack } from '../utils/safeNavigation';
import api from '../services/api';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type: 'text' | 'system';
}

export default function AdminChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb } = useResponsive();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userStatus, setUserStatus] = useState('EN ATTENTE');
  const [isTyping, setIsTyping] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/auth/support/');
      const backendMsgs = response.data.messages || [];
      const mapped = backendMsgs.map((msg: any) => ({
        id: String(msg.id),
        content: msg.content,
        timestamp: msg.timestamp,
        isMe: msg.isMe,
        type: msg.type === 'system' ? 'system' : 'text'
      }));
      
      if (mapped.length === 0) {
        setMessages([
          {
            id: '1',
            content: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui ? Que ce soit pour une tontine, votre statut KYC ou un problème de versement, nous sommes là pour vous guider.',
            timestamp: '10:00',
            isMe: false,
            type: 'text',
          },
        ]);
      } else {
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Erreur support messages:', err);
    }
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await SecureStore.getItemAsync('user_status');
        if (status) {
          setUserStatus(status);
        }
      } catch {
        // fail silently
      }
    };
    loadStatus();

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || sendLoading) return;

    const content = inputText;
    setInputText('');
    setSendLoading(true);

    try {
      await api.post('/auth/support/', {
        content: content
      });
      await fetchMessages();
    } catch (err) {
      console.error(err);
      setInputText(content);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setSendLoading(false);
    }
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
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
                  <Ionicons name="arrow-back" size={24} color="#0284c7" />
                </TouchableOpacity>

                {/* Avatar Support */}
                <View style={styles.avatarContainer}>
                  <MaterialCommunityIcons name="face-agent" size={20} color="#FFFFFF" />
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>Assistance Nkap</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>En ligne</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => Alert.alert('Assistance Nkap', 'Support technique disponible 24h/24 pour vos tontines et votre KYC.')}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={22} color="#6d797d" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
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
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <View key={msg.id} style={styles.systemMsgWrap}>
                    <View style={styles.systemMsgCard}>
                      <Ionicons name="shield-checkmark" size={16} color="#0284c7" />
                      <Text style={styles.systemMsgText}>{msg.content}</Text>
                    </View>
                  </View>
                );
              }

              if (msg.isMe) {
                return (
                  <View key={msg.id} style={styles.myMsgWrap}>
                    <View style={styles.myMsgCard}>
                      <Text style={styles.myMsgText}>{msg.content}</Text>
                      <View style={styles.myMsgFooter}>
                        <Text style={styles.myMsgTime}>{msg.timestamp}</Text>
                        <MaterialCommunityIcons name="check-all" size={14} color="#4ade80" />
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={styles.otherMsgWrap}>
                  <View style={styles.otherMsgCard}>
                    <Text style={styles.otherMsgText}>{msg.content}</Text>
                    <Text style={styles.otherMsgTime}>{msg.timestamp}</Text>
                  </View>
                </View>
              );
            })}

            {isTyping && (
              <View style={styles.otherMsgWrap}>
                <View style={styles.typingCard}>
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text style={styles.typingText}>Support Nkap écrit...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
            <View style={[styles.bottomBarInner, isWeb && styles.webWidthLimit]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Posez votre question à l'assistance..."
                  placeholderTextColor="#a0aec0"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                />
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoid: { flex: 1 },
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
    flex: 1,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#00424f',
    fontSize: 15,
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
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  systemMsgWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMsgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    maxWidth: '90%',
  },
  systemMsgText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  myMsgWrap: {
    width: '100%',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  myMsgCard: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    borderTopRightRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
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
  otherMsgWrap: {
    width: '100%',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  otherMsgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  otherMsgText: {
    color: '#1c2426',
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
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  typingText: {
    color: '#0284c7',
    fontSize: 12,
    fontStyle: 'italic',
  },
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
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#a0aec0',
    opacity: 0.6,
  },
});

import { useEffect, useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Clock, 
  Bot, 
  Sparkles,
  Smartphone,
  X,
  Search
} from 'lucide-react';
import api from '../services/api';

interface SupportUser {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
}

interface ChatMessage {
  id: number;
  sender_name: string;
  sender_phone: string;
  sender_id: number | null;
  content: string;
  message_type: 'text' | 'system' | 'image';
  external_image_url?: string;
  created_at: string;
}

export default function Support() {
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeUser, setActiveUser] = useState<SupportUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Poll the overall users list every 10 seconds to detect new support requests
    const intervalId = setInterval(fetchUsers, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Poll chat messages for the active conversation every 4 seconds
  useEffect(() => {
    if (!activeUser) return;

    const pollMessages = async () => {
      try {
        const response = await api.get(`/admin/users/${activeUser.id}/support/`);
        // Only update state if message count changes
        if (response.data.messages.length !== messages.length) {
          setMessages(response.data.messages);
        }
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des messages:', err);
      }
    };

    const intervalId = setInterval(pollMessages, 4000);
    return () => clearInterval(intervalId);
  }, [activeUser, messages.length]);

  const loadChat = async (user: SupportUser) => {
    setActiveUser(user);
    setLoadingChat(true);
    setInputText('');
    try {
      const response = await api.get(`/admin/users/${user.id}/support/`);
      setMessages(response.data.messages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !inputText.trim() || sendLoading) return;

    setSendLoading(true);
    const content = inputText;
    setInputText('');

    try {
      const response = await api.post(`/admin/users/${activeUser.id}/support/`, {
        content: content
      });
      
      const userStr = localStorage.getItem('nkap_admin_user');
      const adminObj = userStr ? JSON.parse(userStr) : null;
      const newMsg: ChatMessage = {
        id: response.data.id,
        sender_name: response.data.sender_name || adminObj?.full_name || 'Admin',
        sender_phone: adminObj?.phone_number || '',
        sender_id: response.data.sender_id,
        content: content,
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      // Update local users list message state
      setUsers(prev => prev.map(u => {
        if (u.id === activeUser.id) {
          return {
            ...u,
            lastMessage: content,
            lastMessageTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return u;
      }));
    } catch (err: any) {
      console.error(err);
      setInputText(content);
    } finally {
      setSendLoading(false);
    }
  };

  // Scroll to bottom on chat load or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const formatMessageTime = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filters:
  // If search is empty, show only users with support history (lastMessage exists and isn't empty/default).
  // If search is not empty, show all matching users.
  const displayedUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm);

    if (!searchTerm.trim()) {
      return user.lastMessage && user.lastMessage !== "Aucun message d'assistance";
    }
    return matchesSearch;
  });

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-13rem)] bg-white rounded-3xl border border-slate-100 shadow-sm flex overflow-hidden">
      {/* Sidebar discussions - Hide on mobile if a discussion is active */}
      <div className={`w-full md:w-96 border-r border-slate-100 flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header Discussion Search */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Tickets Support</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Interlocuteurs connectés sur l'application mobile</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un membre pour l'assister..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-slate-405 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {displayedUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm font-medium">
              {searchTerm ? "Aucun membre trouvé." : "Aucun ticket d'assistance en cours."}
            </div>
          ) : (
            displayedUsers.map((user) => {
              const isSelected = activeUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => loadChat(user)}
                  className={`w-full p-5 text-left flex items-start gap-4 transition-all ${
                    isSelected ? 'bg-slate-50 border-l-4 border-brand-500 pl-4' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div 
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#006c49' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-950 truncate">{user.name}</h4>
                      {user.lastMessageTime && (
                        <span className="text-[10px] text-slate-400 font-bold">{user.lastMessageTime}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{user.phone}</p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-2">{user.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${!activeUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Header info */}
            <div className="h-20 bg-white border-b border-slate-100 px-6 flex items-center gap-4 flex-shrink-0">
              <button 
                onClick={() => setActiveUser(null)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 md:hidden hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: activeUser.avatarColor || '#006c49' }}
              >
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{activeUser.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-slate-400" />
                  Client Mobile ({activeUser.phone})
                </p>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-12 h-12 text-slate-300" />
                  <p className="text-sm font-bold">Début de la discussion</p>
                  <p className="text-xs max-w-xs leading-relaxed">Envoyez un message pour démarrer le chat d'assistance avec l'utilisateur.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id !== null && msg.sender_id !== Number(activeUser.id);
                  const isSystem = msg.message_type === 'system';
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-3 animate-fade-in">
                        <div className="bg-slate-200/60 border border-slate-200/20 text-slate-500 text-[10px] font-bold py-1.5 px-3 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-4 space-y-1 shadow-sm ${
                        isMe 
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wide uppercase opacity-75">
                          {isMe ? 'Support Nkap' : msg.sender_name}
                          {!isMe && msg.sender_phone === '237690000001' && <Sparkles className="w-3 h-3 text-brand-500" />}
                        </div>
                        
                        {msg.message_type === 'image' && msg.external_image_url ? (
                          <div className="mt-1">
                            <img src={msg.external_image_url} alt="Envoyé" className="rounded-lg max-w-full h-auto object-cover max-h-48" />
                          </div>
                        ) : (
                          <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        
                        <div className="flex justify-end text-[9px] font-bold opacity-60 gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatMessageTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="h-20 bg-white border-t border-slate-100 px-6 flex items-center gap-4 flex-shrink-0">
              <input
                type="text"
                placeholder="Rédigez votre réponse ici..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sendLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sendLoading}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Aucune discussion sélectionnée</h4>
            <p className="text-sm max-w-xs text-center leading-relaxed">Choisissez une discussion dans le panneau latéral pour commencer à dialoguer avec les membres.</p>
          </div>
        )}
      </div>
    </div>
  );
}

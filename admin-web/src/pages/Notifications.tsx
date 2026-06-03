import { useEffect, useState } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  Search,
  CheckCircle,
  X
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  phone: string;
}

interface SentNotification {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  timeLabel: string;
  userId: number | null;
  userName: string;
  userPhone: string | null;
}

export default function Notifications() {
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetUserId, setTargetUserId] = useState('all'); // 'all' or specific user ID

  // Search filter for history
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, notifRes] = await Promise.all([
        api.get('/admin/users/'),
        api.get('/admin/notifications/')
      ]);
      setUsers(usersRes.data);
      setNotifications(notifRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger les données (membres et historique).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitLoading) return;

    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/notifications/', {
        title: title.trim(),
        content: content.trim(),
        userId: targetUserId === 'all' ? 'all' : Number(targetUserId)
      });

      setSuccess('La notification a été envoyée avec succès.');
      setTitle('');
      setContent('');
      setTargetUserId('all');
      
      // Refresh notifications list
      const notifRes = await api.get('/admin/notifications/');
      setNotifications(notifRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Erreur lors de l\'envoi de la notification.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter history
  const filteredNotifications = notifications.filter(n => {
    const term = searchTerm.toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      n.content.toLowerCase().includes(term) ||
      n.userName.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Notifications & Alertes</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Diffusez des annonces générales de maintenance ou envoyez des rappels personnalisés aux membres</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Compose Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rédiger un Message</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Envoyer en temps réel à l'application mobile</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Destinataire</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-800 focus:outline-none focus:border-brand-500 text-xs font-semibold"
              >
                <option value="all">Tous les membres (Diffusion globale)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Titre de la notification</label>
              <input
                type="text"
                placeholder="Ex: Maintenance système"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Contenu du message</label>
              <textarea
                placeholder="Ex: Chers membres, une maintenance est programmée ce dimanche..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || submitLoading}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-xs border border-brand-600"
            >
              <Send className="w-4 h-4" />
              {submitLoading ? 'Envoi en cours...' : 'Envoyer la Notification'}
            </button>
          </form>
        </div>

        {/* Right: History List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200/50">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Historique des Messages</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Registre de toutes les diffusions et alertes</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* History List Container */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                Aucune notification envoyée pour le moment.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div 
                  key={n.id}
                  className="border border-slate-100 hover:border-slate-200 p-5 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                        Cible : <span className={`px-2 py-0.5 rounded-full ${n.userId ? 'bg-brand-500/10 text-brand-600' : 'bg-slate-200/50 text-slate-600'}`}>
                          {n.userName} {n.userPhone ? `(${n.userPhone})` : ''}
                        </span>
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">{n.timeLabel}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

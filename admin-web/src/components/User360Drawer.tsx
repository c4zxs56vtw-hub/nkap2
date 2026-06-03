import { useEffect, useState } from 'react';
import {
  X,
  Coins,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  ArrowUpDown,
  Trophy,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import type { User360Data } from '../types';

interface User360DrawerProps {
  userId: string | null;
  onClose: () => void;
}

/**
 * Sliding Drawer component displaying a 360-degree detailed overview of a user:
 * - Profile and balance info
 * - Trust score index (assiduousness)
 * - Complete transaction log
 * - Enrolled tontines
 * - Support messages history
 */
export default function User360Drawer({ userId, onClose }: User360DrawerProps) {
  const [user360Data, setUser360Data] = useState<User360Data | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'tontines' | 'support'>('transactions');
  const [error, setError] = useState('');

  // Fetch 360 detailed data when selected userId changes
  useEffect(() => {
    const fetchUser360 = async () => {
      if (!userId) {
        setUser360Data(null);
        return;
      }
      setLoading360(true);
      setError('');
      try {
        const response = await api.get(`/admin/users/${userId}/360/`);
        setUser360Data(response.data);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger les détails 360° de l'utilisateur.");
      } finally {
        setLoading360(false);
      }
    };
    fetchUser360();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end transition-all">
      <div className="bg-white w-full max-w-5xl h-full shadow-2xl flex flex-col md:flex-row relative animate-slide-left overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {loading360 ? (
          /* Loading State */
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
            <span className="text-xs text-slate-400 font-bold">Chargement des données 360°...</span>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <span className="text-sm font-bold text-slate-600">{error}</span>
          </div>
        ) : user360Data ? (
          /* Main Drawer Content */
          <>
            {/* Left Panel: Profile Info & Assiduousness */}
            <div className="w-full md:w-96 bg-slate-50 border-r border-slate-200/60 p-8 overflow-y-auto flex flex-col gap-6 pt-16">
              
              {/* Header Profile Identity */}
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-20 h-20 rounded-full bg-brand-500 text-white flex items-center justify-center text-3xl font-bold uppercase shadow-md shadow-brand-500/10">
                  {user360Data.personal_info.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{user360Data.personal_info.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wide">ID: {user360Data.personal_info.id}</p>
                </div>
              </div>

              {/* Account Balance Widget */}
              <div className="bg-white rounded-2xl border border-slate-200/50 p-4 shadow-sm space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Solde Actuel</span>
                <div className="flex items-center gap-2 text-xl font-black text-slate-900">
                  <Coins className="w-5 h-5 text-amber-500" />
                  {Number(user360Data.personal_info.balance).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Attendance / Trust Score Index */}
              <div className="bg-white rounded-2xl border border-slate-200/50 p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assiduité / Confiance</span>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                    {user360Data.personal_info.trust_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${user360Data.personal_info.trust_score}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  L'indice d'assiduité est basé sur la régularité des cotisations de tontine et le profil de risque de l'utilisateur.
                </p>
              </div>

              {/* Personal Information details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200">Informations de Profil</h4>
                
                <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Téléphone</span>
                      <span className="text-slate-800 font-bold">{user360Data.personal_info.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Email</span>
                      <span className="text-slate-800 font-bold">{user360Data.personal_info.email || 'Non renseigné'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Mobile Money</span>
                      <span className="text-slate-800 font-bold">{user360Data.personal_info.mobile_money_number || 'Non configuré'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Pays</span>
                      <span className="text-slate-800 font-bold">{user360Data.personal_info.country === 'CM' ? 'Cameroun (CEMAC)' : user360Data.personal_info.country}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Rôle système</span>
                      <span className="text-slate-800 font-bold uppercase">{user360Data.personal_info.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Date d'inscription</span>
                      <span className="text-slate-800 font-bold">{user360Data.personal_info.date_joined}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Flags */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200">Statuts Administratifs</h4>
                
                <div className="flex flex-col gap-2">
                  {/* Access Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Accès application</span>
                    {user360Data.personal_info.is_blacklisted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Bloqué (Blacklist)</span>
                    ) : !user360Data.personal_info.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">Suspendu</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Autorisé</span>
                    )}
                  </div>
                  {user360Data.personal_info.blacklisted_reason && (
                    <p className="text-[10px] text-rose-600 italic bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                      <strong>Motif de blocage :</strong> {user360Data.personal_info.blacklisted_reason}
                    </p>
                  )}

                  {/* KYC status */}
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500 font-bold">Vérification KYC</span>
                    {user360Data.personal_info.kyc_status === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Vérifié</span>
                    ) : user360Data.personal_info.kyc_status === 'REJECTED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Rejeté</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">En attente</span>
                    )}
                  </div>
                  {user360Data.personal_info.kyc_rejection_reason && (
                    <p className="text-[10px] text-rose-600 italic bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                      <strong>Motif de rejet KYC :</strong> {user360Data.personal_info.kyc_rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Transaction history, tontines and support history */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 pt-16">
              {/* Tabs Selector */}
              <div className="flex border-b border-slate-200">
                {[
                  { id: 'transactions', label: 'Transactions', icon: ArrowUpDown },
                  { id: 'tontines', label: 'Tontines', icon: Trophy },
                  { id: 'support', label: 'Tickets Support', icon: MessageSquare }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
                        activeTab === tab.id
                          ? 'border-brand-500 text-brand-500 bg-brand-50/10'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 overflow-y-auto">
                {/* Transactions list */}
                {activeTab === 'transactions' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historique des Transactions</h4>
                    
                    {user360Data.transactions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                        Aucune transaction enregistrée pour ce membre.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 uppercase">
                              <th className="py-3 px-4">Libellé</th>
                              <th className="py-3 px-4">Montant</th>
                              <th className="py-3 px-4">Méthode</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {user360Data.transactions.map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-3.5 px-4">
                                  <span className="font-bold text-slate-800 block">{t.label}</span>
                                  {t.subtitle && <span className="text-[9px] text-slate-400 block">{t.subtitle}</span>}
                                </td>
                                <td className={`py-3.5 px-4 font-bold ${t.direction === 'in' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {t.direction === 'in' ? '+' : ''}{t.amount.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 uppercase">{t.method || 'NKAP'}</td>
                                <td className="py-3.5 px-4 text-slate-400">{t.created_at}</td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    t.status === 'completed' 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : t.status === 'pending'
                                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                    {t.status === 'completed' ? 'Complété' : t.status === 'pending' ? 'En cours' : 'Échoué'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Enrolled Tontines progress list */}
                {activeTab === 'tontines' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tontines Inscrites</h4>
                    
                    {user360Data.tontines.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                        Ce membre ne participe à aucune tontine pour le moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {user360Data.tontines.map((t: any) => (
                          <div key={t.id} className="border border-slate-200/60 rounded-2xl p-5 hover:border-brand-500/30 transition-all bg-white flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.icon_bg, color: t.icon_color }}>
                              <Trophy className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm leading-snug">{t.title}</h5>
                                <span className="text-[10px] text-slate-400 font-semibold">{t.subtitle}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>Montant cible : {t.pool_amount.toLocaleString('fr-FR')} FCFA</span>
                                <span className="text-brand-600">{t.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-brand-500 h-full rounded-full" 
                                  style={{ width: `${t.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Support conversation message history */}
                {activeTab === 'support' && (
                  <div className="space-y-4 flex flex-col h-full">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historique de l'Assistance</h4>
                    
                    {user360Data.support_messages.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                        Aucune discussion d'assistance en cours pour ce membre.
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-[450px] border border-slate-150 rounded-2xl bg-slate-50/30 p-5 space-y-4">
                        {user360Data.support_messages.map((msg: any) => (
                          <div 
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] ${
                              msg.is_from_user ? 'mr-auto items-start' : 'ml-auto items-end'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mb-1">
                              <span>{msg.sender_name}</span>
                              {msg.sender_role && msg.sender_role !== 'MEMBER' && (
                                <span className="text-[8px] bg-brand-50 text-brand-600 border border-brand-100 px-1 py-0.2 rounded font-extrabold uppercase">
                                  {msg.sender_role.replace('_', ' ')}
                                </span>
                              )}
                              <span className="font-semibold text-slate-300">•</span>
                              <span className="font-semibold">{msg.created_at}</span>
                            </div>
                            <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                              msg.is_from_user
                                ? 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none shadow-sm'
                                : 'bg-brand-500 text-white rounded-tr-none border border-brand-600 shadow-sm'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

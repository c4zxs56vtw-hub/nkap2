import { useEffect, useState } from 'react';
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Coins, 
  Search, 
  X, 
  Users as UsersIcon,
  Briefcase,
  Plane,
  Home,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

interface TontineMember {
  id: string;
  name: string;
  phone: string;
}

interface TontineDetail {
  id: number;
  title: string;
  subtitle: string;
  poolAmount: number;
  activeMembers: number;
  progress: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  treasurerName: string;
  memberName: string;
  created_at: string;
  members: TontineMember[];
}

interface UserSummary {
  id: string;
  name: string;
  phone: string;
}

const AVAILABLE_ICONS = [
  { name: 'airplane', icon: Plane },
  { name: 'briefcase', icon: Briefcase },
  { name: 'home', icon: Home },
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'sparkles', icon: Sparkles },
  { name: 'layers', icon: Layers }
];

export default function Tontines() {
  const [tontines, setTontines] = useState<TontineDetail[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TontineDetail | null>(null);
  
  // Selected/Editing fields
  const [editingTontine, setEditingTontine] = useState<TontineDetail | null>(null); // null = new tontine
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [poolAmount, setPoolAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [icon, setIcon] = useState('airplane');
  const [treasurerName, setTreasurerName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchTontinesAndUsers = async () => {
    try {
      const [tontinesRes, usersRes] = await Promise.all([
        api.get('/admin/tontines/'),
        api.get('/admin/users/')
      ]);
      setTontines(tontinesRes.data);
      // Map only necessary user details
      const userList = usersRes.data.map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone
      }));
      setUsers(userList);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger les tontines ou la liste des membres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTontinesAndUsers();
  }, []);

  const openCreateModal = () => {
    setEditingTontine(null);
    setTitle('');
    setSubtitle('');
    setPoolAmount(10000);
    setProgress(0);
    setIcon('airplane');
    setTreasurerName('');
    setMemberName('');
    setSelectedMemberIds([]);
    setActionError('');
    setShowEditModal(true);
  };

  const openEditModal = (tontine: TontineDetail) => {
    setEditingTontine(tontine);
    setTitle(tontine.title);
    setSubtitle(tontine.subtitle || '');
    setPoolAmount(tontine.poolAmount);
    setProgress(tontine.progress);
    setIcon(tontine.icon);
    setTreasurerName(tontine.treasurerName || '');
    setMemberName(tontine.memberName || '');
    setSelectedMemberIds(tontine.members.map(m => m.id));
    setActionError('');
    setShowEditModal(true);
  };

  const handleSaveTontine = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    const payload = {
      title,
      subtitle,
      pool_amount: poolAmount,
      progress,
      icon,
      treasurer_name: treasurerName,
      member_name: memberName,
      members: selectedMemberIds
    };

    try {
      if (editingTontine) {
        // Edit existing
        await api.put(`/admin/tontines/${editingTontine.id}/`, payload);
      } else {
        // Create new
        await api.post('/admin/tontines/', payload);
      }
      
      await fetchTontinesAndUsers();
      setShowEditModal(false);
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.error || err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTontine = async () => {
    if (!showDeleteConfirm) return;
    setActionLoading(true);
    setActionError('');

    try {
      await api.delete(`/admin/tontines/${showDeleteConfirm.id}/`);
      await fetchTontinesAndUsers();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error(err);
      setActionError('Impossible de supprimer la tontine.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const filteredTontines = tontines.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconComponent = (iconName: string) => {
    const matched = AVAILABLE_ICONS.find(i => i.name === iconName);
    return matched ? matched.icon : Layers;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tontines en cours</h2>
          <p className="text-slate-500 mt-1">Créez, modifiez et gérez les groupes de tontines de la plateforme Nkap.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-brand-500/10 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Créer une Tontine
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 font-semibold">
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une tontine par titre ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTontines.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 font-semibold shadow-sm">
            Aucune tontine trouvée.
          </div>
        ) : (
          filteredTontines.map((tontine) => {
            const IconComponent = getIconComponent(tontine.icon);
            return (
              <div 
                key={tontine.id} 
                className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
              >
                <div>
                  {/* Top line with Icon and Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                      style={{ 
                        backgroundColor: tontine.iconBg || '#006c491a', 
                        color: tontine.iconColor || '#006c49',
                        borderColor: (tontine.iconColor || '#006c49') + '2a'
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(tontine)}
                        className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-slate-50 transition-all"
                        title="Modifier la tontine"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(tontine)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50/5 transition-all"
                        title="Supprimer la tontine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tontine #{tontine.id}</span>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{tontine.title}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2">{tontine.subtitle}</p>
                  </div>

                  {/* Tontine specs details */}
                  <div className="grid grid-cols-2 gap-4 my-5 py-3 border-y border-slate-50 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Montant global</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1 mt-0.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        {Number(tontine.poolAmount).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Membres inscrits</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1 mt-0.5">
                        <UsersIcon className="w-3.5 h-3.5 text-brand-600" />
                        {tontine.activeMembers} membre{tontine.activeMembers > 1 && 's'}
                      </span>
                    </div>
                  </div>

                  {/* Progress segment */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Progression du cycle</span>
                      <span className="text-brand-600">{tontine.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2 border border-slate-100 overflow-hidden">
                      <div 
                        className="bg-brand-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${tontine.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer with member highlights */}
                <div className="text-[10px] font-semibold text-slate-400 mt-2 flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                  <span>Trésorier: <strong className="text-slate-700">{tontine.treasurerName || 'Non défini'}</strong></span>
                  <span>Créée le: <strong className="text-slate-700">{tontine.created_at}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation / Edition Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative animate-scale-up border border-slate-100 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6 flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {editingTontine ? 'Modifier la Tontine' : 'Créer une Tontine'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Paramétrage du groupe d'épargne</p>
              </div>
            </div>

            {actionError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 font-semibold mb-4 text-sm flex-shrink-0">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveTontine} className="space-y-6 overflow-y-auto pr-2 flex-1">
              
              {/* Form Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Titre de la tontine</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tontine Paris 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Sous-titre / Description</label>
                  <input
                    type="text"
                    placeholder="Ex: Épargne pour les projets professionnels"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Montant global (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ex: 500000"
                    value={poolAmount}
                    onChange={(e) => setPoolAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Progression (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    placeholder="Ex: 25"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nom du trésorier</label>
                  <input
                    type="text"
                    placeholder="Ex: Sarah"
                    value={treasurerName}
                    onChange={(e) => setTreasurerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nom d'affichage membre principal</label>
                  <input
                    type="text"
                    placeholder="Ex: Aminata"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Icon selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Icône visuelle de la tontine</label>
                <div className="flex gap-3">
                  {AVAILABLE_ICONS.map((iOption) => {
                    const IOptionComponent = iOption.icon;
                    const isSelected = icon === iOption.name;
                    return (
                      <button
                        key={iOption.name}
                        type="button"
                        onClick={() => setIcon(iOption.name)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                          isSelected 
                            ? 'bg-brand-50 border-brand-500 text-brand-600 scale-105' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        <IOptionComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Member Selection list */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Associer des membres ({selectedMemberIds.length} sélectionnés)</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Cochez les membres à inscrire dans cette tontine :</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-48 overflow-y-auto divide-y divide-slate-150">
                  {users.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center font-medium">Aucun membre disponible.</p>
                  ) : (
                    users.map((user) => {
                      const isSelected = selectedMemberIds.includes(user.id);
                      return (
                        <div 
                          key={user.id} 
                          onClick={() => toggleMemberSelection(user.id)}
                          className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-100/50 rounded-xl px-2 transition-colors first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{user.name}</p>
                            <span className="text-[9px] text-slate-400 font-semibold">{user.phone}</span>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-brand-600 border-brand-600 text-white' 
                              : 'bg-white border-slate-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 flex-shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-45"
                >
                  {actionLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    editingTontine ? 'Enregistrer les modifications' : 'Créer la Tontine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-up border border-slate-100">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Supprimer la Tontine
                </h3>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Action définitive</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-500 text-sm leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la tontine <strong className="text-slate-800">"{showDeleteConfirm.title}"</strong> ? Cette action supprimera définitivement le groupe, toutes ses transactions associées et l'historique des cotisations des membres.
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteTontine}
                disabled={actionLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 disabled:opacity-45"
              >
                {actionLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Confirmer Suppression'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { 
  Search, 
  Lock, 
  Unlock, 
  Coins, 
  Layers,
  UserPlus,
  Eye
} from 'lucide-react';
import api from '../services/api';
import type { UserDetail } from '../types';

// Import des sous-composants modulaires extraits pour le Clean Code
import LockUserModal from '../components/LockUserModal';
import SuspendUserModal from '../components/SuspendUserModal';
import CreateAdminModal from '../components/CreateAdminModal';
import User360Drawer from '../components/User360Drawer';

/**
 * Page de gestion des utilisateurs de la plateforme Nkap.
 * Affiche la liste des membres, permet la recherche, le filtrage,
 * et orchestre l'ouverture des fenêtres modales d'actions et du profil 360°.
 */
export default function Users() {
  // ==========================================
  // ÉTATS DE LA LISTE ET DES FILTRES
  // ==========================================
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED'>('ALL');

  // ==========================================
  // ÉTATS D'ORCHESTRATION DES COMPOSANTS ENCAPSULÉS
  // ==========================================
  const [viewingUser360Id, setViewingUser360Id] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [selectedSuspendUser, setSelectedSuspendUser] = useState<UserDetail | null>(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // ==========================================
  // CHARGEMENT DES DONNÉES DEPUIS L'API
  // ==========================================
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger les utilisateurs de la plateforme.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // FILTRAGE ET RECHERCHE LOCALE DES MEMBRES
  // ==========================================
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm);

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'ACTIVE') return matchesSearch && !user.isBlacklisted && user.isActive;
    if (filterType === 'SUSPENDED') return matchesSearch && !user.isActive;
    if (filterType === 'BLACKLISTED') return matchesSearch && user.isBlacklisted;

    return matchesSearch;
  });

  // Rendu de l'état de chargement initial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. EN-TÊTE DE LA PAGE AVEC LE BOUTON D'ACTION CRÉATION ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Utilisateurs</h2>
          <p className="text-slate-500 mt-1">Gérez le statut des membres de la plateforme Nkap (blocage, déblocage et soldes).</p>
        </div>
        <button
          onClick={() => setShowCreateAdminModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-brand-500/10 self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          Ajouter un Admin
        </button>
      </div>

      {/* Message d'erreur éventuel de chargement */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* 2. RECHERCHE ET FILTRES RAPIDES DE STATUT */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-initial ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type === 'ALL' && 'Tous les membres'}
              {type === 'ACTIVE' && 'Actifs'}
              {type === 'SUSPENDED' && 'Suspendus'}
              {type === 'BLACKLISTED' && 'Bloqués'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TABLEAU PRINCIPAL DES UTILISATEURS */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Membre</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Solde Portefeuille</th>
                <th className="py-4 px-6">Tontines actives</th>
                <th className="py-4 px-6">Statut de compte</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Colonne Identité */}
                    <td className="py-4.5 px-6">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 group"
                        onClick={() => setViewingUser360Id(user.id)}
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold uppercase border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-slate-900 font-bold group-hover:text-brand-500 transition-all">{user.name}</p>
                            {user.role && user.role !== 'MEMBER' && (
                              <span className="inline-block text-[9px] font-extrabold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 uppercase">
                                {user.role.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Téléphone */}
                    <td className="py-4.5 px-6 text-slate-500">{user.phone}</td>

                    {/* Colonne Solde */}
                    <td className="py-4.5 px-6 text-slate-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Coins className="w-4 h-4 text-amber-500" />
                        {Number(user.balance).toLocaleString('fr-FR')} FCFA
                      </div>
                    </td>

                    {/* Colonne Nombre de Tontines */}
                    <td className="py-4.5 px-6 text-slate-500">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {user.tontinesCount}
                      </span>
                    </td>

                    {/* Colonne Statuts du compte */}
                    <td className="py-4.5 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {!user.isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-50 animate-pulse mr-0.5"></span>
                            Suspendu
                          </span>
                        )}
                        {user.isBlacklisted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <Lock className="w-3.5 h-3.5" />
                            Bloqué
                          </span>
                        ) : (
                          user.isActive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <Unlock className="w-3.5 h-3.5" />
                              Actif
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    {/* Colonne Boutons d'Actions rapides */}
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        
                        {/* Action 1 : Affichage Profil 360° */}
                        <button
                          onClick={() => setViewingUser360Id(user.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Profil 360°
                        </button>

                        {/* Action 2 : Suspension / Réactivation */}
                        {user.isActive ? (
                          <button
                            onClick={() => setSelectedSuspendUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedSuspendUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Activer
                          </button>
                        )}

                        {/* Action 3 : Blocage (Blacklist) / Déblocage */}
                        {user.isBlacklisted ? (
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Débloquer
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Bloquer
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          INTÉGRATION DES COMPOSANTS MODULAIRES EXTRAITS
          ========================================== */}

      {/* Modal 1: Blocage / Déblocage d'un membre */}
      <LockUserModal 
        isOpen={!!selectedUser} 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onSuccess={() => { setSelectedUser(null); fetchUsers(); }} 
      />

      {/* Modal 2: Suspension temporaire ou réactivation d'un compte */}
      <SuspendUserModal 
        isOpen={!!selectedSuspendUser} 
        user={selectedSuspendUser} 
        onClose={() => setSelectedSuspendUser(null)} 
        onSuccess={() => { setSelectedSuspendUser(null); fetchUsers(); }} 
      />

      {/* Modal 3: Formulaire de création de nouveaux administrateurs */}
      <CreateAdminModal 
        isOpen={showCreateAdminModal} 
        onClose={() => setShowCreateAdminModal(false)} 
        onSuccess={() => { setShowCreateAdminModal(false); fetchUsers(); }} 
      />

      {/* Drawer 4: Panneau latéral de profil détaillé (Vue 360°) */}
      <User360Drawer 
        userId={viewingUser360Id} 
        onClose={() => setViewingUser360Id(null)} 
      />

    </div>
  );
}

import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  FileText, 
  Check, 
  X, 
  Eye, 
  Search 
} from 'lucide-react';
import api from '../services/api';

interface UserKyc {
  id: string;
  name: string;
  phone: string;
  kycStatus: string;
  rawKycStatus: string;
  kycRejectionReason: string;
  identityDocument: string;
  mobileMoneyNumber: string;
}

export default function Kyc() {
  const [users, setUsers] = useState<UserKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'EN_ATTENTE' | 'VERIFIE' | 'NON_DEPOSE'>('ALL');
  
  // Selected user for detailed KYC view/action
  const [selectedUser, setSelectedUser] = useState<UserKyc | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger les dossiers KYC.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleKycAction = async (userId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/admin/users/${userId}/kyc/`, {
        status: status,
        reason: status === 'REJECTED' ? rejectReason : ''
      });
      
      // Refresh user list and close modal
      await fetchUsers();
      setSelectedUser(null);
      setRejectReason('');
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm);
    
    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'EN_ATTENTE') return matchesSearch && user.kycStatus === 'EN ATTENTE';
    if (filterStatus === 'VERIFIE') return matchesSearch && user.kycStatus === 'VÉRIFIÉ';
    if (filterStatus === 'NON_DEPOSE') return matchesSearch && user.kycStatus === 'NON DÉPOSÉ';
    
    return matchesSearch;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vérification KYC</h2>
          <p className="text-slate-500 mt-1">Examinez et validez les documents d'identité soumis par les utilisateurs.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Filters and search */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['ALL', 'EN_ATTENTE', 'VERIFIE', 'NON_DEPOSE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'ALL' && 'Tous les dossiers'}
              {status === 'EN_ATTENTE' && 'En attente'}
              {status === 'VERIFIE' && 'Vérifiés'}
              {status === 'NON_DEPOSE' && 'Non déposés'}
            </button>
          ))}
        </div>
      </div>

      {/* KYC Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Utilisateur</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Momo Connecté</th>
                <th className="py-4 px-6">Statut KYC</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Aucun dossier KYC trouvé correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-slate-900 font-bold">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-slate-500">{user.phone}</td>
                    <td className="py-4.5 px-6 text-slate-500">{user.mobileMoneyNumber || 'Non renseigné'}</td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        user.kycStatus === 'VÉRIFIÉ'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : user.kycStatus === 'EN ATTENTE'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                          : user.kycStatus === 'REFUSÉ'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {user.kycStatus === 'VÉRIFIÉ' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {user.kycStatus === 'EN ATTENTE' && <Clock className="w-3.5 h-3.5" />}
                        {user.kycStatus === 'REFUSÉ' && <X className="w-3.5 h-3.5" />}
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Examiner
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Verification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-up border border-slate-100">
            <button
              onClick={() => {
                setSelectedUser(null);
                setRejectReason('');
                setActionError('');
              }}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Examen du dossier KYC</h3>
            <p className="text-slate-400 text-sm mb-6">Utilisateur : <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.phone})</p>

            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 font-semibold mb-6">
                {actionError}
              </div>
            )}

            <div className="space-y-6">
              {/* Document Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-700">Pièce d'identité fournie</h4>
                {selectedUser.identityDocument ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-4 flex flex-col items-center justify-center min-h-[250px]">
                    {selectedUser.identityDocument.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-16 h-16 text-red-500" />
                        <a 
                          href={selectedUser.identityDocument} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700 text-sm font-bold underline"
                        >
                          Télécharger / Visualiser le PDF
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <img 
                          src={selectedUser.identityDocument} 
                          alt="Pièce d'identité" 
                          className="max-h-[350px] w-auto mx-auto rounded-xl object-contain border border-slate-200 shadow-sm"
                          onError={(e) => {
                            // Fallback if image fails to render
                            e.currentTarget.style.display = 'none';
                            const fallback = document.getElementById('image-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div id="image-fallback" className="hidden flex-col items-center gap-3 py-10">
                          <FileText className="w-16 h-16 text-slate-400" />
                          <a 
                            href={selectedUser.identityDocument} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-700 text-sm font-bold underline"
                          >
                            Ouvrir le fichier d'identité
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl py-12 text-center text-slate-400 text-sm">
                    Aucun document n'a été téléversé pour le moment.
                  </div>
                )}
              </div>

              {/* Action Form */}
              {(selectedUser.kycStatus === 'EN ATTENTE' || selectedUser.kycStatus === 'REFUSÉ') && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 space-y-4">
                  {selectedUser.kycStatus === 'REFUSÉ' && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-xs mb-2">
                      <strong>Dossier précédemment rejeté :</strong> {selectedUser.kycRejectionReason || "Aucun motif spécifié."}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Motif de rejet (obligatoire en cas de refus)</label>
                    <textarea
                      placeholder="Ex: Document flou, pièce périmée ou informations ne correspondant pas au profil..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => handleKycAction(selectedUser.id, 'REJECTED')}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                      Rejeter le dossier
                    </button>
                    <button
                      onClick={() => handleKycAction(selectedUser.id, 'VERIFIED')}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold py-3.5 rounded-2xl text-sm hover:from-brand-600 hover:to-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
                    >
                      <Check className="w-4 h-4" />
                      Approuver & Valider
                    </button>
                  </div>
                </div>
              )}

              {selectedUser.kycStatus === 'VÉRIFIÉ' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-emerald-800 font-bold">Dossier vérifié</h5>
                    <p className="text-emerald-700 text-xs mt-0.5">Cet utilisateur a déjà passé avec succès la procédure KYC.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

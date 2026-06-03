import { useEffect, useState } from 'react';
import {
  Search,
  X,
  Shield,
  User,
  Lock,
  Unlock,
  Bell,
  Database,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Activity
} from 'lucide-react';
import api from '../services/api';

interface AuditLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
  adminName: string;
  adminPhone: string | null;
  adminRole: string | null;
  timeLabel: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/audit-logs/');
      setLogs(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger le journal d\'activité de l\'équipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Map actions to Categories & Styles
  const getActionInfo = (action: string) => {
    switch (action) {
      case 'KYC_APPROVE':
        return { label: 'KYC Approuvé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', icon: CheckCircle };
      case 'KYC_REJECT':
        return { label: 'KYC Rejeté', color: 'bg-red-50 text-red-700 border-red-200/50', icon: AlertTriangle };
      case 'USER_SUSPEND':
        return { label: 'Compte Suspendu', color: 'bg-orange-50 text-orange-700 border-orange-200/50', icon: Lock };
      case 'USER_UNSUSPEND':
        return { label: 'Compte Réhabilité', color: 'bg-green-50 text-green-700 border-green-200/50', icon: Unlock };
      case 'USER_LOCK':
        return { label: 'Mis sur Liste Noire', color: 'bg-slate-900 text-slate-100 border-slate-800', icon: Shield };
      case 'USER_UNLOCK':
        return { label: 'Retiré de Liste Noire', color: 'bg-sky-50 text-sky-700 border-sky-200/50', icon: Unlock };
      case 'ADMIN_CREATE':
        return { label: 'Admin Créé', color: 'bg-purple-50 text-purple-700 border-purple-200/50', icon: User };
      case 'TONTINE_CREATE':
        return { label: 'Tontine Créée', color: 'bg-teal-50 text-teal-700 border-teal-200/50', icon: Trophy };
      case 'TONTINE_UPDATE':
        return { label: 'Tontine Modifiée', color: 'bg-blue-50 text-blue-700 border-blue-200/50', icon: RefreshCw };
      case 'TONTINE_DELETE':
        return { label: 'Tontine Supprimée', color: 'bg-rose-50 text-rose-700 border-rose-200/50', icon: AlertTriangle };
      case 'TRANSACTION_STATUS_UPDATE':
        return { label: 'Statut Transac.', color: 'bg-amber-50 text-amber-700 border-amber-200/50', icon: Database };
      case 'NOTIFICATION_SEND':
        return { label: 'Notification Envoyée', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/50', icon: Bell };
      default:
        return { label: action, color: 'bg-slate-50 text-slate-700 border-slate-200/50', icon: FileText };
    }
  };

  const getAdminRoleLabel = (role: string | null) => {
    if (!role) return 'Système';
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'COMPLIANCE_ADMIN':
        return 'Compliance';
      case 'SECURITY_ADMIN':
        return 'Sécurité';
      case 'SUPPORT_ADMIN':
        return 'Support';
      default:
        return role;
    }
  };

  // Filter logs by search term & category
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.adminPhone && log.adminPhone.includes(searchTerm)) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === 'ALL') return matchesSearch;
    if (selectedCategory === 'KYC') return matchesSearch && log.action.startsWith('KYC_');
    if (selectedCategory === 'SECURITY') {
      return (
        matchesSearch &&
        (log.action.startsWith('USER_') || log.action === 'ADMIN_CREATE')
      );
    }
    if (selectedCategory === 'TONTINE') return matchesSearch && log.action.startsWith('TONTINE_');
    if (selectedCategory === 'TRANSACTION') return matchesSearch && log.action === 'TRANSACTION_STATUS_UPDATE';
    if (selectedCategory === 'NOTIFICATION') return matchesSearch && log.action === 'NOTIFICATION_SEND';

    return matchesSearch;
  });

  // Calculate Statistics
  const totalCount = logs.length;
  const kycCount = logs.filter((l) => l.action.startsWith('KYC_')).length;
  const securityCount = logs.filter(
    (l) => l.action.startsWith('USER_') || l.action === 'ADMIN_CREATE'
  ).length;
  const tontineCount = logs.filter((l) => l.action.startsWith('TONTINE_')).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Journal d'Activité</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Suivi d'audit et historique complet des actions effectuées par l'équipe administrative
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Actions</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Actions KYC</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{kycCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Sécurité & Accès</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{securityCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Gestion Tontines</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{tontineCount}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100 max-w-fit">
            {[
              { id: 'ALL', label: 'Tout' },
              { id: 'KYC', label: 'KYC' },
              { id: 'SECURITY', label: 'Sécurité & Admins' },
              { id: 'TONTINE', label: 'Tontines' },
              { id: 'TRANSACTION', label: 'Transactions' },
              { id: 'NOTIFICATION', label: 'Notifications' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par admin, détails, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-9 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Heure</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrateur</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Détails de l'action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                      <span className="text-xs text-slate-400 font-semibold">Chargement des données...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <FileText className="w-8 h-8" />
                      <span className="text-xs font-bold">Aucune action trouvée</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Modifiez les filtres de recherche ou effectuez une action d'administration pour la voir apparaître ici.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const info = getActionInfo(log.action);
                  const IconComp = info.icon;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Date & Time */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-bold text-slate-600 block">{log.timeLabel}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(log.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>

                      {/* Admin Identity */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{log.adminName}</span>
                          {log.adminPhone && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {log.adminPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Admin Role */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.adminRole === 'SUPER_ADMIN'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : log.adminRole === 'COMPLIANCE_ADMIN'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : log.adminRole === 'SECURITY_ADMIN'
                            ? 'bg-slate-900 text-slate-100'
                            : log.adminRole === 'SUPPORT_ADMIN'
                            ? 'bg-teal-50 text-teal-600 border border-teal-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {getAdminRoleLabel(log.adminRole)}
                        </span>
                      </td>

                      {/* Action Category Tag */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${info.color}`}>
                          <IconComp className="w-3 h-3" />
                          {info.label}
                        </span>
                      </td>

                      {/* Action Details */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-600 leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

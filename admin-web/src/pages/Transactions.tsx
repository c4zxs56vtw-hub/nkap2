import { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  X, 
  Download, 
  Check, 
  Clock, 
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';

interface Transaction {
  id: number;
  label: string;
  subtitle: string;
  amount: number;
  direction: 'in' | 'out';
  status: 'completed' | 'pending' | 'failed';
  dateLabel: string;
  time: string;
  method: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  userId: number;
  userName: string;
  userPhone: string;
  rawDate: string;
}

interface TransactionStats {
  totalVolume: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingCount: number;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/transactions/');
      setTransactions(response.data.transactions);
      setStats(response.data.stats);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de récupérer l\'historique des transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = async (transactionId: number, status: 'completed' | 'failed') => {
    setActionLoading(transactionId);
    try {
      await api.post(`/admin/transactions/${transactionId}/status/`, { status });
      await fetchTransactions(); // Reload stats and items to keep in sync
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la mise à jour du statut.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filters logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.userPhone.includes(searchTerm) ||
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.method.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDirection = 
      directionFilter === 'all' || 
      t.direction === directionFilter;

    const matchesStatus = 
      statusFilter === 'all' || 
      t.status === statusFilter;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  // Export currently filtered list to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Utilisateur', 'Téléphone', 'Libellé', 'Type', 'Moyen', 'Montant (FCFA)', 'Statut', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.userName,
      t.userPhone,
      t.label,
      t.direction === 'in' ? 'Dépôt' : 'Retrait',
      t.method,
      t.amount,
      t.status === 'completed' ? 'Validé' : t.status === 'pending' ? 'En cours' : 'Échoué',
      t.rawDate ? new Date(t.rawDate).toLocaleString('fr-FR') : t.dateLabel
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nkap_export_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center max-w-xl mx-auto mt-10">
        <p className="text-red-600 font-semibold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit des Transactions</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Supervisez l'intégralité des flux financiers et validez les opérations en attente</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-xs border border-brand-600"
        >
          <Download className="w-4 h-4" />
          Exporter en CSV ({filteredTransactions.length})
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume total traité</span>
            <h3 className="text-xl font-black text-slate-950 mt-1">
              {(stats?.totalVolume || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-500">FCFA</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Dépôts, retraits et tontines confondus</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total des Dépôts</span>
            <h3 className="text-xl font-black text-emerald-600 mt-1">
              +{(stats?.totalDeposits || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-500">FCFA</span>
            </h3>
          </div>
          <p className="text-[10px] text-emerald-600/80 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Entrées validées sur la plateforme
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total des Retraits</span>
            <h3 className="text-xl font-black text-rose-600 mt-1">
              -{(stats?.totalWithdrawals || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-500">FCFA</span>
            </h3>
          </div>
          <p className="text-[10px] text-rose-600/80 font-medium mt-2 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Sorties d'argent complétées
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transactions en attente</span>
            <h3 className={`text-xl font-black mt-1 ${(stats?.pendingCount || 0) > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
              {stats?.pendingCount || 0}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Dépôts / cotisations à valider</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par membre, numéro, libellé ou mode de paiement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-9 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs font-semibold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Direction filters */}
          <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 flex-shrink-0">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                directionFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setDirectionFilter('in')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                directionFilter === 'in' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Dépôts
            </button>
            <button
              onClick={() => setDirectionFilter('out')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                directionFilter === 'out' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Retraits
            </button>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 flex-shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tous statuts
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'completed' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Validés
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'pending' 
                  ? 'bg-white text-amber-500 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'failed' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Échoués
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">Membre</th>
                <th className="py-4 px-5">Libellé</th>
                <th className="py-4 px-5">Méthode</th>
                <th className="py-4 px-5">Montant</th>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Statut</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Aucune transaction ne correspond à vos critères.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isPositive = t.direction === 'in';
                  const isPending = t.status === 'pending';
                  const isCompleted = t.status === 'completed';
                  const isFailed = t.status === 'failed';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-4 px-5 text-slate-400 font-mono">#{t.id}</td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-bold text-slate-950">{t.userName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.userPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-bold text-slate-900">{t.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.subtitle}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-semibold">{t.method}</td>
                      <td className="py-4 px-5">
                        <span className={`font-extrabold text-sm ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isPositive ? '+' : '-'} {Math.abs(t.amount).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="text-slate-800">{t.dateLabel}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.time}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Check className="w-3 h-3" /> Validé
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-500 border border-amber-100 animate-pulse">
                            <Clock className="w-3 h-3" /> En cours
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            <AlertTriangle className="w-3 h-3" /> Échoué
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleUpdateStatus(t.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-[10px] transition-all"
                            >
                              Valider
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleUpdateStatus(t.id, 'failed')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold text-[10px] transition-all"
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          // Allow admin to toggle status back or change status for audit reasons
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={t.status}
                              disabled={actionLoading !== null}
                              onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-brand-500"
                            >
                              <option value="completed">Validé</option>
                              <option value="pending">En cours</option>
                              <option value="failed">Échoué</option>
                            </select>
                          </div>
                        )}
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

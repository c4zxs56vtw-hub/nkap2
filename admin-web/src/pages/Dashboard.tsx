import { useEffect, useState } from 'react';
import { 
  Users, 
  Coins, 
  Layers, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck 
} from 'lucide-react';
import api from '../services/api';

interface Stats {
  totalUsers: number;
  pendingKyc: number;
  verifiedKyc: number;
  totalTontines: number;
  totalFunds: number;
  totalPool: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats/');
        setStats(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Impossible de récupérer les statistiques en direct.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  const statCards = [
    {
      title: 'Membres inscrits',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-brand-600 to-brand-500',
      shadow: 'shadow-brand-600/20',
      desc: 'Utilisateurs enregistrés'
    },
    {
      title: 'Dossiers KYC en attente',
      value: stats?.pendingKyc || 0,
      icon: Clock,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
      desc: 'À valider dans l\'onglet KYC'
    },
    {
      title: 'Membres vérifiés',
      value: stats?.verifiedKyc || 0,
      icon: UserCheck,
      color: 'from-brand-500 to-emerald-600',
      shadow: 'shadow-brand-500/20',
      desc: 'Profils KYC approuvés'
    },
    {
      title: 'Tontines actives',
      value: stats?.totalTontines || 0,
      icon: Layers,
      color: 'from-emerald-600 to-brand-700',
      shadow: 'shadow-emerald-600/20',
      desc: 'Groupes de tontines créés'
    },
    {
      title: 'Fonds totaux des membres',
      value: `${(stats?.totalFunds || 0).toLocaleString('fr-FR')} FCFA`,
      icon: Coins,
      color: 'from-brand-700 to-brand-900',
      shadow: 'shadow-brand-700/20',
      desc: 'Solde cumulé des portefeuilles'
    },
    {
      title: 'Total des pools actifs',
      value: `${(stats?.totalPool || 0).toLocaleString('fr-FR')} FCFA`,
      icon: TrendingUp,
      color: 'from-emerald-700 to-brand-600',
      shadow: 'shadow-emerald-700/20',
      desc: 'Fonds circulant dans les tontines'
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-brand-800">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-400 mt-2 leading-relaxed">
            Bienvenue dans le portail d'administration de <strong>Nkap</strong>. Suivez en temps réel les indicateurs clés d'activité, modérez les dossiers de vérification d'identité (KYC), gérez le statut des utilisateurs, et répondez aux tickets du support client.
          </p>
        </div>
      </div>

      {/* Grid statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i}
              className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg ${card.shadow} transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  En Direct <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">{card.title}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                <p className="text-xs text-slate-400 mt-2">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informative section / platform health */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-base font-extrabold text-slate-900">Conformité et Sécurité en cours de surveillance</h4>
          <p className="text-sm text-slate-500 mt-1">
            Tous les flux financiers et transferts MoMo de la plateforme respectent la réglementation CEMAC en vigueur. Assurez-vous de valider les documents KYC dans les délais pour maintenir un haut niveau de confiance sur la plateforme.
          </p>
        </div>
      </div>
    </div>
  );
}

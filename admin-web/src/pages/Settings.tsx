import { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'account' | 'platform'>('account');

  // Platform settings states
  const [transactionFee, setTransactionFee] = useState(1.00);
  const [tontineFee, setTontineFee] = useState(0.00);
  const [minAmount, setMinAmount] = useState(100);
  const [maxAmount, setMaxAmount] = useState(1000000);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [loadingPlatform, setLoadingPlatform] = useState(false);

  // States for actions
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('nkap_admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUser(user);
      setName(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.phone_number);
      setEmail(user.email || '');
    }
  }, []);

  const fetchPlatformSettings = async () => {
    try {
      const res = await api.get('/admin/settings/');
      setTransactionFee(res.data.transaction_fee_percent);
      setTontineFee(res.data.tontine_fee_percent);
      setMinAmount(res.data.min_transaction_amount);
      setMaxAmount(res.data.max_transaction_amount);
      setIsMaintenance(res.data.is_maintenance_mode);
      setMaintenanceMsg(res.data.maintenance_message);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erreur lors du chargement des paramètres de la plateforme.');
    }
  };

  useEffect(() => {
    if (activeTab === 'platform') {
      fetchPlatformSettings();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Les codes PIN / mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name,
        email: email.trim(),
      };

      if (password) {
        payload.password = password;
      }

      const response = await api.patch('/auth/me/', payload);
      
      // Update local storage with new details
      const updatedUser = {
        ...adminUser,
        full_name: response.data.full_name,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        email: response.data.email,
      };
      
      localStorage.setItem('nkap_admin_user', JSON.stringify(updatedUser));
      setAdminUser(updatedUser);
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg('Informations de profil mises à jour avec succès !');
      
      // Refresh Layout by reloading after 1.5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg('');
    setErrorMsg('');
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/auth/avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const avatarUrl = response.data.avatarUrl;
      const updatedUser = {
        ...adminUser,
        avatarUrl: avatarUrl
      };

      localStorage.setItem('nkap_admin_user', JSON.stringify(updatedUser));
      setAdminUser(updatedUser);
      setSuccessMsg('Avatar mis à jour avec succès !');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erreur lors de l\'envoi de l\'image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePlatformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoadingPlatform(true);

    try {
      const response = await api.post('/admin/settings/', {
        transaction_fee_percent: Number(transactionFee),
        tontine_fee_percent: Number(tontineFee),
        min_transaction_amount: Number(minAmount),
        max_transaction_amount: Number(maxAmount),
        is_maintenance_mode: Boolean(isMaintenance),
        maintenance_message: maintenanceMsg.trim()
      });

      setSuccessMsg('Paramètres généraux de la plateforme enregistrés avec succès !');
      const settings = response.data.settings;
      setTransactionFee(settings.transaction_fee_percent);
      setTontineFee(settings.tontine_fee_percent);
      setMinAmount(settings.min_transaction_amount);
      setMaxAmount(settings.max_transaction_amount);
      setIsMaintenance(settings.is_maintenance_mode);
      setMaintenanceMsg(settings.maintenance_message);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setLoadingPlatform(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Paramètres</h2>
        <p className="text-slate-500 mt-1">Gérez vos informations de compte ou modifiez les règles de la plateforme.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('account');
            setSuccessMsg('');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'account'
              ? 'border-brand-500 text-brand-500 bg-brand-50/10'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Mon Compte
        </button>
        <button
          onClick={() => {
            setActiveTab('platform');
            setSuccessMsg('');
            setErrorMsg('');
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'platform'
              ? 'border-brand-500 text-brand-500 bg-brand-50/10'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Plateforme Nkap
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700 font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Tab rendering */}
      {activeTab === 'account' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Avatar management */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">Photo de profil</h3>
            
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center relative shadow-sm">
                {adminUser?.avatarUrl ? (
                  <img src={adminUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-400" />
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />

            <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
              Cliquez sur l'avatar pour téléverser une nouvelle photo de profil (PNG, JPG).
            </p>
          </div>

          {/* Right Column - Account fields form */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3">Informations d'identification</h3>
              
              {/* Phone (Read Only) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Numéro de téléphone (Non modifiable)</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-500 font-semibold text-sm">
                  {adminUser?.phone_number || adminUser?.phone || 'Non renseigné'}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nom complet</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paul Biya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Ex: admin@nkap.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 pt-4">Sécurité</h3>

              {/* Password PIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nouveau code PIN / mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Laissez vide pour conserver l'actuel"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Confirmer le PIN / mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Confirmez le nouveau PIN"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Panel - Quick Settings Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">Règles globales</h3>
            
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mode Maintenance</span>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Le mode maintenance bloque immédiatement les transactions et la navigation sur l'application mobile. Utilisez-le en cas de panne, mise à jour système ou déploiement majeur.
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Frais et Limites</span>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Ces barèmes s'appliquent immédiatement à chaque nouvelle cotisation et transfert Orange Money / MTN Mobile Money initié sur la plateforme.
              </p>
            </div>
          </div>

          {/* Right Panel - Platform Configuration Form */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <form onSubmit={handlePlatformSubmit} className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-500" />
                Configuration du Système
              </h3>

              {/* Fees configuration in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Frais de Transaction (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={transactionFee}
                      onChange={(e) => setTransactionFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Frais de Tontine (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={tontineFee}
                      onChange={(e) => setTontineFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Min and Max amounts in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Montant Minimum Transaction</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={minAmount}
                      onChange={(e) => setMinAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                    <span className="absolute right-4 top-3 text-[9px] font-bold text-slate-400 uppercase">FCFA</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Montant Maximum Transaction</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
                    />
                    <span className="absolute right-4 top-3 text-[9px] font-bold text-slate-400 uppercase">FCFA</span>
                  </div>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 pt-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Mode de Maintenance
              </h3>

              {/* Toggle switcher for maintenance */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Activer le Mode Maintenance</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    Bloque l'accès mobile et affiche le message ci-dessous.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isMaintenance} 
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {/* Maintenance message textarea */}
              {isMaintenance && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Message de maintenance personnalisé</label>
                  <textarea
                    required
                    rows={4}
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    placeholder="Chers utilisateurs, Nkap est en cours de maintenance technique. Nous serons de retour dans quelques instants..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPlatform || (isMaintenance && !maintenanceMsg.trim())}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {loadingPlatform ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer les paramètres de la plateforme
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

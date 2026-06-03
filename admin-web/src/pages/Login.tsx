import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, Lock, Eye, EyeOff, AlertTriangle, Mail } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !pin) {
      setError('Veuillez remplir le numéro de téléphone et le code PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login/', {
        phone_number: phoneNumber,
        pin: pin,
        email: email,
      });

      const { token, user } = response.data;

      if (user.role === 'MEMBER') {
        setError('Accès refusé. Ce portail est réservé aux administrateurs.');
        setLoading(false);
        return;
      }

      localStorage.setItem('nkap_admin_token', token);
      localStorage.setItem('nkap_admin_user', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Numéro ou code PIN incorrect.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for premium aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse delay-75"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4 animate-bounce">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nkap Admin</h1>
          <p className="text-slate-500 text-sm mt-2 text-center font-medium">Portail de modération et gestion de la plateforme</p>
        </div>

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-slate-700 text-sm font-bold block">Numéro de téléphone</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Ex: 690515143"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-700 text-sm font-bold block">Adresse e-mail (facultative)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                placeholder="Ex: admin@nkap.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-700 text-sm font-bold block">Code PIN d'accès</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-base tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-500 to-emerald-600 text-white font-bold py-4 rounded-2xl hover:from-brand-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center text-base"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Se connecter '
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

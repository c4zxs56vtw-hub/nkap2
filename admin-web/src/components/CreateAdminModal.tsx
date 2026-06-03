import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import api from '../services/api';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal dialog for co-admins account creation.
 * Admin role assignment, telephone, PIN security configuration.
 */
export default function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('SUPER_ADMIN');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  if (!isOpen) return null;

  // Resets modal fields to default values
  const resetForm = () => {
    setNewAdminName('');
    setNewAdminPhone('');
    setNewAdminPin('');
    setNewAdminEmail('');
    setNewAdminRole('SUPER_ADMIN');
    setCreateError('');
  };

  // Submission handler to POST co-admin registration data
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setCreateError('');

    try {
      await api.post('/admin/create-admin/', {
        full_name: newAdminName,
        phone_number: newAdminPhone,
        pin: newAdminPin,
        role: newAdminRole,
        email: newAdminEmail
      });

      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setCreateError(err.response?.data?.error || err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-up border border-slate-100">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Créer un Administrateur
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Nouveau membre de gestion</p>
          </div>
        </div>

        {/* Error Alert */}
        {createError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 font-semibold mb-4 text-sm">
            {createError}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Nom complet</label>
            <input
              type="text"
              required
              placeholder="Ex: Marc Ndip"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Numéro de téléphone</label>
            <input
              type="tel"
              required
              placeholder="Ex: 690123456"
              value={newAdminPhone}
              onChange={(e) => setNewAdminPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Code PIN (4 chiffres)</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="Ex: 1234"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold text-center tracking-widest"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Rôle assigné</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="COMPLIANCE_ADMIN">Compliance Admin</option>
                <option value="SECURITY_ADMIN">Security Admin</option>
                <option value="SUPPORT_ADMIN">Support Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Adresse Email (Optionnel)</label>
            <input
              type="email"
              placeholder="Ex: helper@nkap.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-semibold"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
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
                'Créer l\'Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

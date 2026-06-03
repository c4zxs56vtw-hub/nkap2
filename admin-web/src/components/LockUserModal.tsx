import { useState } from 'react';
import { X, Unlock, Lock } from 'lucide-react';
import api from '../services/api';
import type { UserDetail } from '../types';

interface LockUserModalProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal component to confirm and process locking (blacklisting) or unlocking a user account.
 * Restricts user mobile app access. Generates audit log on backend.
 */
export default function LockUserModal({ isOpen, user, onClose, onSuccess }: LockUserModalProps) {
  const [lockReason, setLockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!isOpen || !user) return null;

  // Handles updating the blacklist lock status
  const handleToggleLock = async () => {
    setActionLoading(true);
    setActionError('');
    const newBlacklistState = !user.isBlacklisted;
    
    try {
      await api.post(`/admin/users/${user.id}/lock/`, {
        is_blacklisted: newBlacklistState,
        reason: newBlacklistState ? lockReason : ''
      });
      
      setLockReason('');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-up border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            user.isBlacklisted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
          }`}>
            {user.isBlacklisted ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {user.isBlacklisted ? 'Débloquer l\'utilisateur' : 'Bloquer l\'utilisateur'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">{user.name}</p>
          </div>
        </div>

        {/* Error Notification */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 font-semibold mb-4 text-sm">
            {actionError}
          </div>
        )}

        {/* Form Body depending on lock/unlock action */}
        {!user.isBlacklisted ? (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm leading-relaxed">
              Le blocage suspend l'accès de l'utilisateur à l'application mobile Nkap. Ses transactions en cours seront gelées.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Raison du blocage (visible par l'admin)</label>
              <textarea
                placeholder="Raison du blocage de compte (ex: tentative de fraude, usurpation, comportement suspect)..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir réhabiliter le compte de cet utilisateur ? Il pourra à nouveau se connecter et exécuter des cotisations.
            </p>
            {user.blacklistedReason && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Raison précédente du blocage :</span>
                <p className="text-slate-700 text-sm mt-1 italic">"{user.blacklistedReason}"</p>
              </div>
            )}
          </div>
        )}

        {/* Form Actions Footer */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleToggleLock}
            disabled={actionLoading || (!user.isBlacklisted && !lockReason.trim())}
            className={`flex-1 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
              user.isBlacklisted 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25' 
                : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25'
            } disabled:opacity-45`}
          >
            {actionLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : user.isBlacklisted ? (
              'Confirmer Déblocage'
            ) : (
              'Confirmer Blocage'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

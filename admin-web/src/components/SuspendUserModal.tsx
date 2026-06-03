import { useState } from 'react';
import { X, CheckCircle, Lock } from 'lucide-react';
import api from '../services/api';
import type { UserDetail } from '../types';

interface SuspendUserModalProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal component to confirm suspending (deactivating) or reactivating a user account.
 * Affects authentication capability on mobile app. Generates audit log on backend.
 */
export default function SuspendUserModal({ isOpen, user, onClose, onSuccess }: SuspendUserModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!isOpen || !user) return null;

  // Handles updating the authentication active status
  const handleToggleSuspend = async () => {
    setActionLoading(true);
    setActionError('');
    const newActiveState = !user.isActive;
    
    try {
      await api.post(`/admin/users/${user.id}/suspend/`, {
        is_active: newActiveState
      });
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.detail || err.response?.data?.error || 'Une erreur est survenue.');
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
            user.isActive ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            {user.isActive ? (
              <Lock className="w-6 h-6 text-amber-500" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {user.isActive ? 'Suspendre l\'utilisateur' : 'Réactiver l\'utilisateur'}
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

        {/* Form Body */}
        <div className="space-y-4">
          <p className="text-slate-500 text-sm leading-relaxed">
            {user.isActive ? (
              "La suspension désactivera le compte de l'utilisateur. Il ne pourra plus se connecter à l'application mobile et toutes ses actions en cours seront bloquées."
            ) : (
              "Êtes-vous sûr de vouloir réactiver le compte de cet utilisateur ? Il pourra à nouveau se connecter et exécuter ses actions normalement."
            )}
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleToggleSuspend}
            disabled={actionLoading}
            className={`flex-1 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
              user.isActive 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/25' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25'
            } disabled:opacity-45`}
          >
            {actionLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : user.isActive ? (
              'Confirmer Suspension'
            ) : (
              'Confirmer Réactivation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

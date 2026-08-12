import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-purple-950/80 border-purple-500/40 text-purple-100 shadow-purple-900/30'
              : toast.type === 'error'
              ? 'bg-red-950/80 border-red-500/40 text-red-100 shadow-red-900/30'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100 shadow-indigo-900/30'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="flex-1 text-sm font-medium leading-relaxed">{toast.text}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

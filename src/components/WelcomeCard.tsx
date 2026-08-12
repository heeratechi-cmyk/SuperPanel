import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Sparkles } from 'lucide-react';

export default function WelcomeCard() {
  const { userProfile } = useAuth();

  const name = userProfile?.name || 'Valued Client';
  const email = userProfile?.email || 'user@superpanel.com';

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden group backdrop-blur-xl">
      {/* Background glow effects */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500"></div>
      <div className="absolute -left-8 -top-8 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>CUSTOMER DASHBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Welcome back, <span className="text-indigo-400 font-extrabold">{name}</span> 👋
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{email}</span>
          </p>
        </div>

        <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
          <span className="text-2xl font-black text-indigo-400">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, RefreshCw, PlusCircle, History } from 'lucide-react';

interface WalletCardProps {
  onNavigate: (route: string) => void;
}

export default function WalletCard({ onNavigate }: WalletCardProps) {
  const { userProfile, refreshUserProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUserProfile();
    setTimeout(() => setRefreshing(false), 600);
  };

  const balance = userProfile?.walletBalance || 0;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(79,70,229,0.3)] relative overflow-hidden flex flex-col justify-between">
      {/* Glow highlight behind balance */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Balance Info */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200">
            <Wallet className="w-4 h-4 text-white" />
            <span>WALLET BALANCE</span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-2 tracking-tight flex items-baseline gap-2">
            <span className="text-indigo-200 text-2xl sm:text-3xl font-sans">Rs.</span>
            <span>{balance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <p className="text-xs text-indigo-100/80 mt-1 font-medium">
            Verified real-time balance on SuperPanel Cloud
          </p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition-all border border-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-white' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => onNavigate('/add-funds')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Funds Now</span>
          </button>

          <button
            onClick={() => onNavigate('/orders')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <History className="w-4 h-4 text-indigo-200" />
            <span>Order History</span>
          </button>
        </div>
      </div>
    </div>
  );
}

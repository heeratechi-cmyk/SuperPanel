import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Wallet, 
  Clock, 
  ArrowLeftRight, 
  HelpCircle, 
  User, 
  Settings, 
  ShieldCheck, 
  PlusCircle,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Sidebar({ currentRoute, onNavigate }: SidebarProps) {
  const { userProfile, refreshUserProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const navItems = [
    { label: 'Dashboard', route: '/', icon: Home },
    { label: 'Browse Services', route: '/services', icon: ShoppingBag },
    { label: 'Add Funds', route: '/add-funds', icon: PlusCircle, highlight: true },
    { label: 'Order History', route: '/orders', icon: Clock },
    { label: 'Deposits', route: '/deposits', icon: FileCheck2 },
    { label: 'Transactions', route: '/transactions', icon: ArrowLeftRight },
    { label: 'Support & Help', route: '/support', icon: HelpCircle },
    { label: 'My Profile', route: '/profile', icon: User },
    { label: 'Settings', route: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800/60 bg-slate-950/50 backdrop-blur-xl p-4 min-h-[calc(100vh-4rem)]">
      {/* Quick Balance Summary Box */}
      {userProfile && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/40 border border-slate-800/60 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Wallet className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
              Available Balance
            </span>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setRefreshing(true);
                await refreshUserProfile();
                setTimeout(() => setRefreshing(false), 500);
              }}
              disabled={refreshing}
              title="Refresh Balance"
              className="p-1 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
          <div className="text-xl font-black text-white mt-1 font-mono">
            Rs. {(userProfile.walletBalance || 0).toLocaleString()}
          </div>
          <button
            onClick={() => onNavigate('/add-funds')}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Funds</span>
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                  : item.highlight
                  ? 'text-indigo-300 hover:bg-indigo-950/30 border border-indigo-800/30 hover:border-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Admin Link */}
        {userProfile?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-slate-800/60">
            <button
              onClick={() => onNavigate('/admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentRoute === '/admin'
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                  : 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Admin Management</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-800/60 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          SUPERPANEL v2.0
        </p>
        <p className="text-[9px] text-indigo-400/80 mt-0.5">
          BY CLIMAX PRODUCTION
        </p>
      </div>
    </aside>
  );
}

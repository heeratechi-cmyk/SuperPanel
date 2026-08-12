import React from 'react';
import { 
  FileCheck2, 
  PlusCircle, 
  Clock, 
  ShoppingBag, 
  HelpCircle, 
  ArrowLeftRight, 
  ShieldCheck, 
  Wallet,
  Sparkles
} from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-12 pt-8 border-t border-slate-800/80 bg-slate-950/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Column */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-purple-600/30">
              SP
            </div>
            <span className="font-extrabold text-white text-base tracking-tight font-mono">
              SUPER<span className="text-purple-400">PANEL</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Automated SMM & Virtual Number verification services engine with instant deposit processing.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              JazzCash & SadaPay Live
            </span>
          </div>
        </div>

        {/* Quick Deposit & Wallet Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-purple-400" />
            Wallet & Deposits
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('/deposits')}
                className="text-purple-300 hover:text-purple-200 font-bold flex items-center gap-2 transition-colors group"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Deposit History</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-[9px] text-purple-200 border border-purple-700/50">
                  Track
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/add-funds')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-gray-400" />
                <span>Add Funds (JazzCash/SadaPay)</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/transactions')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                <span>Wallet Transactions</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Services & Orders */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
            Services & Orders
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('/services')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                <span>Browse Services</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/orders')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>My Orders</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/support')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                <span>Support Center</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Instant Deposit Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border border-purple-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">
              Deposit Verification
            </span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-[11px] text-gray-300">
            Need to check your pending deposit request status?
          </p>
          <button
            onClick={() => onNavigate('/deposits')}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/50 flex items-center justify-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Open Deposit History</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p className="font-mono text-[11px]">
          © {new Date().getFullYear()} SUPERPANEL. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => onNavigate('/deposits')} className="hover:text-purple-300 font-semibold text-purple-400/90 transition-colors">
            Deposit History
          </button>
          <span>•</span>
          <button onClick={() => onNavigate('/support')} className="hover:text-gray-300 transition-colors">
            Support
          </button>
          <span>•</span>
          <button onClick={() => onNavigate('/settings')} className="hover:text-gray-300 transition-colors">
            Account Settings
          </button>
        </div>
      </div>
    </footer>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  LogOut, 
  Bell, 
  Palette, 
  Check, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Settings() {
  const { currentUser, userProfile, logout, resetPassword, addToast } = useAuth();
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [depositNotifs, setDepositNotifs] = useState(true);
  const [supportNotifs, setSupportNotifs] = useState(true);

  const handleChangePassword = async () => {
    const email = currentUser?.email || userProfile?.email;
    if (!email) return;
    await resetPassword(email);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Application Settings</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure security, notifications, and visual theme preferences
        </p>
      </div>

      {/* Security Section */}
      <section className="p-6 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Security & Authentication</span>
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Change Password</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Send a secure password reset link to your email</div>
            </div>
            <button
              onClick={handleChangePassword}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 text-xs font-bold transition-colors"
            >
              Reset via Email
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-red-400">Account Logout</div>
              <div className="text-[11px] text-gray-400 mt-0.5">End your current session on SuperPanel</div>
            </div>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="p-6 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <span>In-App Notifications</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between">
            <span className="font-bold text-gray-200">Order Updates & Delivery</span>
            <button
              onClick={() => {
                setOrderNotifs(!orderNotifs);
                addToast('Notification settings saved', 'info');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                orderNotifs ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                orderNotifs ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between">
            <span className="font-bold text-gray-200">Deposit Approvals & Rejections</span>
            <button
              onClick={() => {
                setDepositNotifs(!depositNotifs);
                addToast('Notification settings saved', 'info');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                depositNotifs ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                depositNotifs ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between">
            <span className="font-bold text-gray-200">Support Ticket Replies</span>
            <button
              onClick={() => {
                setSupportNotifs(!supportNotifs);
                addToast('Notification settings saved', 'info');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                supportNotifs ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                supportNotifs ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="p-6 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <span>Visual Theme</span>
        </h2>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>SuperPanel Dark Neon Glass</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Default high-contrast purple theme</div>
          </div>
          <span className="text-[10px] font-bold text-purple-300 bg-purple-950 border border-purple-700 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>
      </section>
    </div>
  );
}

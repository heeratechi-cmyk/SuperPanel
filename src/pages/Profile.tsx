import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Edit3, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function Profile() {
  const { userProfile, updateUserProfileName, addToast } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfileName(name.trim());
      setSaving(false);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setSaving(false);
      addToast('Failed to update name', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Account Profile</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage your personal details and account status
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-6">
        {/* Profile Avatar Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-purple-900/30">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-purple-900/60">
            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{userProfile?.name}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{userProfile?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                <span>Account Active</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono capitalize">
                Role: {userProfile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details & Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-400 mb-1">Full Name</label>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-purple-500 text-white font-bold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-3 rounded-2xl bg-purple-600 text-white font-bold flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30">
                <span className="text-sm font-bold text-white">{userProfile?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setName(userProfile?.name || '');
                    setEditing(true);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-400 mb-1">Email Address</label>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-purple-900/20 text-gray-300 font-mono text-xs">
              {userProfile?.email}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-400 mb-1">Joined Date</label>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-purple-900/20 text-gray-300 font-mono text-xs">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active Client'}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCheck,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/db';
import { NotificationItem } from '../types';

interface HeaderProps {
  onNavigate: (route: string) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { currentUser, userProfile, logout, toggleAdminRoleForDemo, refreshUserProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    const items = await fetchUserNotifications(currentUser.uid);
    setNotifications(items);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsAsRead(currentUser.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <div onClick={() => onNavigate('/')}>
          <Logo size="md" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin Role Mode Switcher */}
          {userProfile && (
            <button
              onClick={toggleAdminRoleForDemo}
              title="Click to toggle between Admin and User role for testing"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                userProfile.role === 'admin'
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(79,70,229,0.3)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {userProfile.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Mode Active</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch to Admin</span>
                </>
              )}
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) loadNotifications();
              }}
              className="relative p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
              )}
            </button>

            {/* Notifications Menu Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-2xl py-3 px-1 z-50">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-800/60">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-950/60 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-800/40">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto my-1 divide-y divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleMarkRead(item.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-900/60 ${
                          !item.read ? 'bg-indigo-950/30 font-medium' : 'text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-white font-semibold mb-1">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Account Menu */}
          <div className="relative" ref={profileRef}>
            {userProfile ? (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60 hover:border-indigo-500/40 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-[0_0_15px_rgba(129,140,248,0.3)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-bold text-white max-w-[100px] truncate">
                    {userProfile.name}
                  </div>
                  <div className="text-[10px] text-indigo-400 font-mono font-semibold">
                    Rs. {(userProfile.walletBalance || 0).toLocaleString()}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all"
              >
                Login
              </button>
            )}

            {/* Profile Menu Dropdown */}
            {showProfileMenu && userProfile && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-2xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-800/60">
                  <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{userProfile.email}</p>
                  <div className="mt-2 text-xs font-medium text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-800/40 flex justify-between items-center">
                    <span>Balance:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono">Rs. {(userProfile.walletBalance || 0).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setRefreshingBalance(true);
                          await refreshUserProfile();
                          setTimeout(() => setRefreshingBalance(false), 500);
                        }}
                        disabled={refreshingBalance}
                        title="Refresh Balance"
                        className="p-0.5 hover:bg-indigo-800/50 rounded-md text-indigo-300 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingBalance ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-900/60 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    My Profile
                  </button>

                  {userProfile.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('/admin');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-indigo-300 bg-indigo-950/30 hover:bg-indigo-900/40 flex items-center gap-2.5 transition-colors font-semibold"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors mt-1 border-t border-slate-800/60"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

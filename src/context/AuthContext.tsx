import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, ToastMessage } from '../types';

interface AuthContextType {
  currentUser: { uid: string; email: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  toasts: ToastMessage[];
  pendingOtpEmail: string | null;
  setPendingOtpEmail: (email: string | null) => void;
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => Promise<void>;
  updateUserProfileName: (newName: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  toggleAdminRoleForDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('superpanel_session');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const profile: UserProfile = {
          uid: u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'ADMIN' ? 'admin' : 'user',
          walletBalance: u.walletBalance,
          status: u.status.toLowerCase(),
          emailVerified: u.emailVerified,
          avatarUrl: u.avatarUrl || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.warn('checkAuth error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const signup = async (email: string, pass: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      if (data.token) {
        localStorage.setItem('superpanel_session', data.token);
      }

      if (data.user) {
        const u = data.user;
        const profile: UserProfile = {
          uid: u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'ADMIN' ? 'admin' : 'user',
          walletBalance: u.walletBalance || 0,
          status: (u.status || 'ACTIVE').toLowerCase(),
          emailVerified: false,
          avatarUrl: u.avatarUrl || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(profile);
      }

      setPendingOtpEmail(email.trim().toLowerCase());
      addToast(data.message || `Account created! Verification code sent to ${email}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      if (data.token) {
        localStorage.setItem('superpanel_session', data.token);
      }

      const u = data.user;
      const profile: UserProfile = {
        uid: u.id,
        name: u.name,
        email: u.email,
        role: u.role === 'ADMIN' ? 'admin' : 'user',
        walletBalance: u.walletBalance,
        status: u.status.toLowerCase(),
        emailVerified: u.emailVerified,
        avatarUrl: u.avatarUrl || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      addToast('Welcome back to SuperPanel!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Login failed.', 'error');
      throw err;
    }
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    const targetEmail = pendingOtpEmail || userProfile?.email;
    if (!targetEmail) {
      addToast('No active verification session found. Please enter your email.', 'error');
      return false;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: targetEmail, otp: code })
      });

      const data = await res.json();
      if (!data.success) {
        addToast(data.message || 'OTP verification failed.', 'error');
        return false;
      }

      if (data.token) {
        localStorage.setItem('superpanel_session', data.token);
      }

      const u = data.user;
      const profile: UserProfile = {
        uid: u.id,
        name: u.name,
        email: u.email,
        role: u.role === 'ADMIN' ? 'admin' : 'user',
        walletBalance: u.walletBalance,
        status: u.status.toLowerCase(),
        emailVerified: true,
        avatarUrl: u.avatarUrl || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      setPendingOtpEmail(null);
      addToast('OTP verified successfully! Welcome to SuperPanel.', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Verification error.', 'error');
      return false;
    }
  };

  const resendOtp = async () => {
    const targetEmail = pendingOtpEmail || userProfile?.email;
    if (!targetEmail) return;

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (!data.success) {
        addToast(data.message || 'Failed to resend OTP.', 'error');
      } else {
        addToast(data.message || 'Fresh OTP code sent!', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to resend OTP.', 'error');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders(), credentials: 'include' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    localStorage.removeItem('superpanel_session');
    setUserProfile(null);
    setPendingOtpEmail(null);
    addToast('Logged out successfully', 'info');
  };

  const resetPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) {
        addToast(data.message || 'Failed to send reset link.', 'error');
      } else {
        addToast(data.message || 'Password reset link sent! Check your email inbox.', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Error requesting password reset.', 'error');
    }
  };

  const updateUserProfileName = async (newName: string) => {
    if (!userProfile) return;
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (!data.success) {
        addToast(data.message || 'Failed to update profile.', 'error');
        return;
      }

      setUserProfile((prev) => prev ? { ...prev, name: newName } : null);
      addToast('Profile name updated successfully!', 'success');
    } catch (e) {
      addToast('Failed to update profile name.', 'error');
    }
  };

  const refreshUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        setUserProfile((prev) => prev ? {
          ...prev,
          walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : parseFloat(u.walletBalance || '0'),
          name: u.name || prev.name,
          email: u.email || prev.email,
          role: u.role === 'ADMIN' ? 'admin' : 'user',
          status: u.status ? u.status.toLowerCase() : prev.status,
          emailVerified: u.emailVerified ?? prev.emailVerified,
          avatarUrl: u.avatarUrl || prev.avatarUrl
        } : {
          uid: u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'ADMIN' ? 'admin' : 'user',
          walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : parseFloat(u.walletBalance || '0'),
          status: u.status ? u.status.toLowerCase() : 'active',
          emailVerified: Boolean(u.emailVerified),
          avatarUrl: u.avatarUrl || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('refreshUserProfile error:', err);
    }
  };

  const toggleAdminRoleForDemo = async () => {
    if (!userProfile) return;
    addToast(`Current user role is ${userProfile.role.toUpperCase()} mode`, 'info');
  };

  const currentUser = userProfile ? { uid: userProfile.uid, email: userProfile.email } : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        toasts,
        pendingOtpEmail,
        setPendingOtpEmail,
        addToast,
        removeToast,
        signup,
        login,
        logout,
        resetPassword,
        verifyOtp,
        resendOtp,
        updateUserProfileName,
        refreshUserProfile,
        toggleAdminRoleForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

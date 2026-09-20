import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Send, Loader2, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}

type Step = 'EMAIL' | 'OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { addToast } = useAuth();
  const [step, setStep] = useState<Step>('EMAIL');

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state (eye buttons)
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & resend states
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      addToast('Please enter your registered email address or username', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        addToast(data.message || 'Failed to send verification code.', 'error');
        if (data.remainingCooldownSec) {
          setResendCooldown(data.remainingCooldownSec);
          if (data.email) setEmail(data.email);
          if (data.username) setUsername(data.username);
          setStep('OTP');
        }
        return;
      }

      if (data.email) {
        setEmail(data.email);
      }
      if (data.username) {
        setUsername(data.username);
      }
      addToast(data.message || 'Verification code sent to your email!', 'success');
      setResendCooldown(60);
      setStep('OTP');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || 'Failed to send verification code.', 'error');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      addToast('Please enter the 6-digit verification code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        addToast(data.message || 'Invalid or expired verification code.', 'error');
        return;
      }

      addToast('Verification code accepted! Set your new password.', 'success');
      setResetToken(data.resetToken || '');
      setStep('RESET_PASSWORD');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || 'OTP verification failed.', 'error');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        addToast(data.message || 'Failed to resend code.', 'error');
        return;
      }

      if (data.username) {
        setUsername(data.username);
      }
      addToast('New verification code sent to your email!', 'success');
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || 'Error resending code.', 'error');
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      addToast('Please enter your new password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        addToast(data.message || 'Failed to change password.', 'error');
        return;
      }

      addToast('Password changed successfully!', 'success');
      setStep('SUCCESS');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || 'Failed to change password.', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl backdrop-blur-2xl space-y-6">
        <button
          type="button"
          onClick={() => onNavigate('/login')}
          className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        {/* STEP 1: ENTER EMAIL */}
        {step === 'EMAIL' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-block mb-2">
                <Logo size="md" />
              </div>
              <h1 className="text-xl font-bold text-white">Reset Password</h1>
              <p className="text-xs text-gray-400">
                Enter your registered email address or username to receive a 6-digit OTP code
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1.5">Email Address or Username</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com or username"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 'OTP' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 text-purple-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Enter OTP Code</h1>
              <p className="text-xs text-gray-400">
                {username ? (
                  <>
                    Hello <span className="font-mono text-purple-300 font-bold">@{username}</span>, a 6-digit code was sent to <span className="font-mono text-purple-300 font-bold">{email}</span>
                  </>
                ) : (
                  <>
                    A 6-digit code was sent to <span className="font-mono text-purple-300 font-bold">{email}</span>
                  </>
                )}
              </p>
            </div>

            {/* Account Details badge */}
            <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-xs space-y-2">
              {username && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Account Username:</span>
                  <span className="font-mono font-bold text-purple-300 bg-purple-900/70 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                    @{username}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Registered Email:</span>
                <span className="font-medium text-gray-200">{email}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1.5 text-center">
                  6-Digit Security Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code & Proceed</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 3: RESET PASSWORD PAGE (WITH EYE BUTTONS) */}
        {step === 'RESET_PASSWORD' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 text-purple-400 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Set New Password</h1>
              <p className="text-xs text-gray-400">
                Create a strong new password for <span className="text-purple-300 font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              {/* New Password Input with Eye Button */}
              <div>
                <label className="block font-bold text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-12 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-300 transition-colors p-1"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input with Eye Button */}
              <div>
                <label className="block font-bold text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-12 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-300 transition-colors p-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Live Password Validation Feedback */}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-400 font-medium">
                  • Passwords do not match
                </p>
              )}
              {newPassword && newPassword.length < 6 && (
                <p className="text-[11px] text-amber-400 font-medium">
                  • Password must be at least 6 characters long
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Password Changed!</h2>
            <p className="text-xs text-gray-300">
              Your account password has been updated successfully. You can now log in with your new password.
            </p>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/50 transition-all"
            >
              Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

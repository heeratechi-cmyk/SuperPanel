import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle2, RotateCw, LogOut, Loader2, KeyRound } from 'lucide-react';

export default function OtpVerification() {
  const { pendingOtpEmail, pendingOtpUsername, userProfile, verifyOtp, resendOtp, refreshUserProfile, logout, addToast } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  const displayEmail = pendingOtpEmail || userProfile?.email || '';
  const displayUsername = pendingOtpUsername || userProfile?.username || userProfile?.name || 'User';

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) {
      addToast('Please enter the full 6-digit OTP code', 'error');
      return;
    }

    setLoading(true);
    try {
      const success = await verifyOtp(otp.trim());
      if (!success) {
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    await resendOtp();
  };

  const handleCheckLinkStatus = async () => {
    setLoading(true);
    await refreshUserProfile();
    setLoading(false);
    addToast('Status checked. If your email is verified, you will be redirected.', 'info');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950 border border-indigo-900/60 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block mb-2">
            <Logo size="lg" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Mail className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white">Email Verification Required</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hello <span className="text-indigo-300 font-bold">@{displayUsername}</span>, we sent a 6-digit verification code to your email.
          </p>
        </div>

        {/* Account Details badge */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account Username:</span>
            <span className="font-mono font-bold text-indigo-300 bg-indigo-900/70 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
              @{displayUsername}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registered Email:</span>
            <span className="font-medium text-slate-200">{displayEmail}</span>
          </div>
        </div>

        {/* Dev OTP Note box */}
        {userProfile?.verificationOtp && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Verification OTP Code:</span>
            </div>
            <span className="font-mono text-sm font-black tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-xl">
              {userProfile.verificationOtp}
            </span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-300">
                Enter 6-Digit OTP Code
              </label>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                Expires in 1 min
              </span>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] font-bold py-3.5 rounded-2xl bg-slate-900 border border-indigo-900/50 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Continue</span>
              </>
            )}
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs gap-2">
            <button
              type="button"
              onClick={handleCheckLinkStatus}
              disabled={loading}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Check Email Link</span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-indigo-400 hover:text-indigo-300 font-bold disabled:opacity-50 transition-colors"
            >
              {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800/60 transition-colors mt-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out & Try Different Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

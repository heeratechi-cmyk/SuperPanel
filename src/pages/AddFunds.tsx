import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitDepositRequest, fetchPaymentMethods } from '../services/db';
import { PaymentMethodConfig, PaymentMethodName } from '../types';
import { 
  Copy, 
  Check, 
  Upload, 
  X, 
  ShieldAlert, 
  Clock, 
  FileCheck2, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

interface AddFundsProps {
  onNavigate: (route: string) => void;
}

export default function AddFunds({ onNavigate }: AddFundsProps) {
  const { userProfile, addToast } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodName>('SadaPay');
  const [copied, setCopied] = useState(false);

  // Form fields
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    const list = await fetchPaymentMethods();
    setMethods(list);
  };

  const activeMethodConfig = methods.find((m) => m.name === selectedMethod) || {
    id: 'sadapay',
    name: 'SadaPay',
    enabled: true,
    accountNumber: '03369917075',
    accountName: 'Shabnam Nadeem',
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activeMethodConfig.accountNumber);
    setCopied(true);
    addToast('Number copied successfully', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      addToast('Please upload a PNG, JPG, or WEBP screenshot', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      addToast('Please login to submit deposit', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 50) {
      addToast('Minimum deposit amount is 50 PKR', 'error');
      return;
    }

    if (!transactionId.trim()) {
      addToast('Transaction ID is required', 'error');
      return;
    }

    if (!senderName.trim()) {
      addToast('Sender Name is required', 'error');
      return;
    }

    if (!screenshotData) {
      addToast('Please upload payment screenshot', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const depId = await submitDepositRequest({
        userId: userProfile.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        amount: numAmount,
        paymentMethod: selectedMethod,
        receiverNumber: activeMethodConfig.accountNumber,
        receiverName: activeMethodConfig.accountName,
        transactionId: transactionId.trim(),
        senderName: senderName.trim(),
        screenshotUrl: screenshotData,
      });

      setSubmitting(false);
      setSubmittedId(depId);
      addToast('Deposit Request Submitted Successfully!', 'success');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      addToast('Failed to submit deposit request. Try again.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Add Funds to Wallet</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Instant submission via SadaPay. Manual admin verification up to 24 hours.
        </p>
      </div>

      {/* 24 HOUR SUCCESS NOTICE MODAL IF SUBMITTED */}
      {submittedId ? (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-purple-500/50 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-400 shadow-xl shadow-purple-900/50">
            <Check className="w-8 h-8 text-purple-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Deposit Request Submitted</h2>
            <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">
              Your payment of <span className="font-bold text-purple-300 font-mono">Rs. {parseFloat(amount).toLocaleString()}</span> has been submitted successfully.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 max-w-md mx-auto text-xs text-purple-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Request Reference:</span>
              <span className="font-mono font-bold text-white">#{submittedId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Approval Window:</span>
              <span className="font-bold text-purple-300">Up to 24 Hours</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Please allow up to 24 hours for verification and approval by our finance team.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/deposits')}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/50 flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View My Deposits</span>
            </button>
            <button
              onClick={() => {
                setSubmittedId(null);
                setAmount('');
                setTransactionId('');
                setSenderName('');
                setScreenshotData(null);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-950 border border-purple-900/40 text-gray-300 text-xs font-bold hover:text-white"
            >
              Submit Another
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* STEP 1: Select Payment Method */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-widest">
              1. Select Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* JazzCash Card */}
              <div
                onClick={() => setSelectedMethod('JazzCash')}
                className={`cursor-pointer relative p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  selectedMethod === 'JazzCash'
                    ? 'bg-gradient-to-br from-purple-950/90 via-slate-900 to-indigo-950/90 border-purple-500 shadow-2xl shadow-purple-900/50 ring-2 ring-purple-500/30'
                    : 'bg-slate-900/70 border-purple-900/30 hover:border-purple-600/40 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 font-extrabold text-base shadow-inner">
                      JC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">JazzCash</h3>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active &amp; Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">JazzCash Mobile Wallet Transfer</p>
                    </div>
                  </div>
                  {selectedMethod === 'JazzCash' && (
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/50">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* SadaPay Card */}
              <div
                onClick={() => setSelectedMethod('SadaPay')}
                className={`cursor-pointer relative p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  selectedMethod === 'SadaPay'
                    ? 'bg-gradient-to-br from-purple-950/90 via-slate-900 to-indigo-950/90 border-purple-500 shadow-2xl shadow-purple-900/50 ring-2 ring-purple-500/30'
                    : 'bg-slate-900/70 border-purple-900/30 hover:border-purple-600/40 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-extrabold text-base shadow-inner">
                      SP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">SadaPay</h3>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active &amp; Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">SadaPay Mobile Banking &amp; Wallet Transfer</p>
                    </div>
                  </div>
                  {selectedMethod === 'SadaPay' && (
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/50">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* STEP 2: Receiver Payment Details Card */}
          <section className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-indigo-950/60 border border-purple-700/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                {selectedMethod} Receiver Account Details
              </span>
              <span className="text-[11px] text-purple-400 bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-700/40">
                Official Receiver
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                    Account / Mobile Number
                  </div>
                  <div className="text-xl font-mono font-extrabold text-white mt-1">
                    {activeMethodConfig.accountNumber}
                  </div>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className="p-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
                >
                  {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Account Name
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {activeMethodConfig.accountName}
                </div>
              </div>
            </div>
          </section>

          {/* Deposit Instructions Steps */}
          <section className="p-6 rounded-3xl bg-slate-900/70 border border-purple-900/30 space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Deposit Instructions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 1:</span>
                <span>Select JazzCash or SadaPay above.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 2:</span>
                <span>Send payment to {activeMethodConfig.accountNumber} ({activeMethodConfig.accountName}).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 3:</span>
                <span>Enter the exact payment Amount (Rs.).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 4:</span>
                <span>Enter Transaction ID (TID / Reference #).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 5:</span>
                <span>Enter Sender Name (Account holder name).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-400">STEP 6:</span>
                <span>Upload payment confirmation screenshot.</span>
              </div>
            </div>
          </section>

          {/* STEP 3: Deposit Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white border-b border-purple-900/30 pb-3">
              Submit Deposit Verification Form
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Amount Sent (PKR / Rs.) <span className="text-purple-400">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/50">
                    Min 50 PKR
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="50"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50 (Minimum 50 PKR)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Minimum deposit requirement is 50 PKR.</p>
              </div>

              {/* Payment Method Selected */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Payment Method <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedMethod}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/50 border border-purple-900/30 text-purple-300 font-bold text-sm cursor-not-allowed"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Transaction ID / TID <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 01928374652"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Sender Account Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your SadaPay Account Name"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Payment Screenshot File Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Upload Payment Screenshot <span className="text-purple-400">*</span>
              </label>

              {screenshotData ? (
                <div className="relative p-4 rounded-2xl bg-slate-900 border border-purple-500/40 flex flex-col items-center gap-3">
                  <img
                    src={screenshotData}
                    alt="Payment Screenshot Preview"
                    className="max-h-56 rounded-xl object-contain border border-purple-900/50"
                  />
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold transition-colors">
                      Change Screenshot
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setScreenshotData(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/80 border-2 border-dashed border-purple-900/60 hover:border-purple-500/60 cursor-pointer transition-all group">
                  <Upload className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-xs font-bold text-white">Click or drag payment screenshot here</p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-extrabold transition-all shadow-xl shadow-purple-900/60 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Deposit Request...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit Deposit Request</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

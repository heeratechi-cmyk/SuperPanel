import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserDeposits } from '../services/db';
import { DepositRecord } from '../types';
import { 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  PlusCircle, 
  Loader2, 
  Search, 
  Eye, 
  X,
  ShieldAlert
} from 'lucide-react';

interface DepositsProps {
  onNavigate: (route: string) => void;
}

export default function Deposits({ onNavigate }: DepositsProps) {
  const { userProfile } = useAuth();
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      loadDeposits();
    }
  }, [userProfile]);

  const loadDeposits = async () => {
    if (!userProfile) return;
    setLoading(true);
    const list = await fetchUserDeposits(userProfile.uid);
    setDeposits(list);
    setLoading(false);
  };

  const filteredDeposits = deposits.filter((dep) => {
    const statusLower = (dep.status || '').toLowerCase();
    const filterLower = filterStatus.toLowerCase();
    
    const matchesFilter = 
      filterStatus === 'ALL' || statusLower === filterLower;
      
    if (!matchesFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dep.depositId.toLowerCase().includes(q) ||
        dep.transactionId.toLowerCase().includes(q) ||
        dep.senderName.toLowerCase().includes(q) ||
        dep.paymentMethod.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const pendingCount = deposits.filter(d => (d.status || '').toLowerCase() === 'pending').length;
  const approvedCount = deposits.filter(d => (d.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = deposits.filter(d => (d.status || '').toLowerCase() === 'rejected').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Deposit History</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Track your JazzCash & SadaPay deposit verification status in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDeposits}
            className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/40 text-purple-300 hover:text-white hover:border-purple-500/50 transition-colors"
            title="Refresh deposits"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('/add-funds')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/50 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Funds</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-purple-900/30">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'ALL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'bg-slate-950 text-gray-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-950 text-[10px] text-purple-300">
              {deposits.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'PENDING'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-950 text-blue-400/80 hover:text-blue-300 border border-blue-900/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-blue-950 text-[10px] text-blue-300 border border-blue-800">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved</span>
            {approvedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-950 text-[10px] text-emerald-300 border border-emerald-800">
                {approvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-slate-950 text-rose-400/80 hover:text-rose-300 border border-rose-900/40'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
            {rejectedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-rose-950 text-[10px] text-rose-300 border border-rose-800">
                {rejectedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Deposit ID or Tx ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Deposit List */}
      {loading ? (
        <div className="py-16 text-center text-purple-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-medium">Fetching deposit requests...</p>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-3">
          <FileCheck2 className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Deposits Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'ALL'
              ? 'No deposit history records match your search or filter criteria.'
              : 'You have not submitted any wallet deposit requests yet. Send payment via JazzCash or SadaPay to add funds.'}
          </p>
          <button
            onClick={() => onNavigate('/add-funds')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/50"
          >
            Submit Deposit Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeposits.map((dep) => {
            const statusLower = (dep.status || 'pending').toLowerCase();

            return (
              <div
                key={dep.depositId}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-purple-900/40 backdrop-blur-xl shadow-xl space-y-3 transition-all hover:border-purple-500/40"
              >
                {/* Top Row: Deposit ID, Date & Method */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-800/50">
                      #{dep.depositId}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(dep.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                    {dep.paymentMethod}
                  </span>
                </div>

                {/* Amount and Status Badge Row (Directly Together) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                      Rs. {dep.amount.toLocaleString()}
                    </span>

                    {/* Status Badge right next to Amount */}
                    {statusLower === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold shadow-md shadow-emerald-950/50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approved</span>
                      </span>
                    ) : statusLower === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-extrabold shadow-md shadow-rose-950/50">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-500/50 text-blue-300 text-xs font-extrabold shadow-md shadow-blue-950/50">
                        <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Subtitle notes */}
                  {statusLower === 'pending' && (
                    <span className="text-[11px] text-blue-300/80 font-medium">
                      Review time: Up to 24 hrs
                    </span>
                  )}
                  {statusLower === 'approved' && (
                    <span className="text-[11px] text-emerald-400/80 font-medium">
                      Funds added to wallet
                    </span>
                  )}
                </div>

                {/* Transaction details */}
                <div className="text-xs text-gray-400 space-y-0.5 font-mono bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                  <div>TID / Reference: <strong className="text-gray-200">{dep.transactionId}</strong></div>
                  <div>Sender Account: <strong className="text-gray-200">{dep.senderName}</strong></div>
                  {statusLower === 'rejected' && dep.rejectionReason && (
                    <div className="text-rose-400 mt-1 font-sans text-[11px]">
                      Rejection Reason: <strong className="text-rose-300">{dep.rejectionReason}</strong>
                    </div>
                  )}
                </div>

                {dep.screenshotUrl && (
                  <button
                    onClick={() => setPreviewScreenshot(dep.screenshotUrl)}
                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 underline font-medium pt-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Payment Receipt Proof</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                Payment Receipt Proof
              </h3>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center bg-slate-950 rounded-2xl p-2 border border-slate-800">
              <img
                src={previewScreenshot}
                alt="Payment Receipt"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


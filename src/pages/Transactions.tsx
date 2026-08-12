import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserTransactions } from '../services/db';
import { TransactionRecord } from '../types';
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from 'lucide-react';

export default function Transactions() {
  const { userProfile } = useAuth();
  const [txns, setTxns] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadTxns();
    }
  }, [userProfile]);

  const loadTxns = async () => {
    if (!userProfile) return;
    setLoading(true);
    const list = await fetchUserTransactions(userProfile.uid);
    setTxns(list);
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Wallet Transactions</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Complete audit trail of all deposits, purchases, refunds and balance changes
          </p>
        </div>

        <button
          onClick={loadTxns}
          className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/40 text-purple-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-purple-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-medium">Loading transaction log...</p>
        </div>
      ) : txns.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-3">
          <ArrowLeftRight className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Transactions Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Your wallet history is clean. Submit a deposit or place an order to see transactions here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {txns.map((t) => {
            const isPositive = t.amount > 0;
            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPositive
                      ? 'bg-purple-950 border border-purple-500/40 text-purple-400'
                      : 'bg-indigo-950 border border-indigo-500/40 text-indigo-400'
                  }`}>
                    {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white capitalize">{t.type}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{t.description}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {new Date(t.date).toLocaleString()} · ID: {t.id}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm font-extrabold font-mono ${
                    isPositive ? 'text-purple-300' : 'text-gray-200'
                  }`}>
                    {isPositive ? '+' : ''}Rs. {t.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Bal: Rs. {t.balanceAfter.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

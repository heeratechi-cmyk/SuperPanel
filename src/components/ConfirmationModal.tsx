import React, { useState } from 'react';
import { ServiceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../services/db';
import { X, ShoppingBag, Wallet, AlertCircle, CheckCircle2, PlusCircle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  service: ServiceItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  onNavigateAddFunds: () => void;
}

export default function ConfirmationModal({
  service,
  isOpen,
  onClose,
  onSuccess,
  onNavigateAddFunds,
}: ConfirmationModalProps) {
  const { userProfile, addToast, refreshUserProfile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentBalance = userProfile?.walletBalance || 0;
  const totalAmount = service.price * quantity;
  const balanceAfter = currentBalance - totalAmount;
  const hasSufficientBalance = currentBalance >= totalAmount;

  const handleConfirm = async () => {
    if (!userProfile) {
      addToast('Please login to place an order', 'error');
      return;
    }

    if (!hasSufficientBalance) {
      addToast('Insufficient wallet balance. Please add funds first.', 'error');
      return;
    }

    setSubmitting(true);
    const res = await placeOrder(userProfile.uid, service.id, quantity);
    setSubmitting(false);

    if (res.success && res.orderId) {
      addToast(`Order #${res.orderId} created successfully!`, 'success');
      await refreshUserProfile();
      onSuccess(res.orderId);
      onClose();
    } else {
      addToast(res.message || 'Failed to place order', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span>Confirm Purchase</span>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-4 text-sm">
          {/* Service Name & Price */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30">
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
              Selected Service
            </div>
            <div className="text-base font-bold text-white mt-0.5">{service.name}</div>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>
            <div className="mt-2 text-xs text-gray-300 font-mono">
              Unit Price: <span className="text-white font-bold">Rs. {service.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-purple-900/30">
            <span className="text-gray-300 font-medium">Quantity</span>
            <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-900/50">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || submitting}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center disabled:opacity-40"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-white font-mono">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(service.stock, q + 1))}
                disabled={quantity >= service.stock || submitting}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Total Amount:</span>
              <span className="text-white font-bold text-sm">Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Current Wallet Balance:</span>
              <span>Rs. {currentBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-purple-900/40">
              <span className="text-purple-300">Balance After Purchase:</span>
              <span className={`font-bold ${balanceAfter >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
                Rs. {balanceAfter.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Low Balance Warning */}
          {!hasSufficientBalance && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Insufficient Wallet Balance</p>
                <p className="text-[11px] text-red-300/90 mt-0.5">
                  You need Rs. {(totalAmount - currentBalance).toLocaleString()} more to complete this order.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          {!hasSufficientBalance ? (
            <button
              onClick={() => {
                onClose();
                onNavigateAddFunds();
              }}
              className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Funds First</span>
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Purchase</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

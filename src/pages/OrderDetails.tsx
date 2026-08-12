import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../services/db';
import { OrderRecord } from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  ShieldCheck, 
  ExternalLink,
  XCircle,
  Loader2
} from 'lucide-react';

interface OrderDetailsProps {
  orderId: string;
  onNavigate: (route: string) => void;
}

export default function OrderDetails({ orderId, onNavigate }: OrderDetailsProps) {
  const { userProfile } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadOrder();
    }
  }, [userProfile, orderId]);

  const loadOrder = async () => {
    if (!userProfile) return;
    setLoading(true);
    const orders = await fetchUserOrders(userProfile.uid);
    const match = orders.find((o) => o.orderId === orderId);
    setOrder(match || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-purple-400 flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-4">
        <h3 className="text-lg font-bold text-white">Order Not Found</h3>
        <p className="text-xs text-gray-400">Order #{orderId} does not exist or does not belong to your account.</p>
        <button
          onClick={() => onNavigate('/orders')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const isCompleted = order.status === 'completed';
  const isProcessing = order.status === 'processing';
  const isCancelled = order.status === 'cancelled' || order.status === 'failed' || order.status === 'refunded';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Back Nav */}
      <button
        onClick={() => onNavigate('/orders')}
        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </button>

      {/* Main Order Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-900/30">
          <div>
            <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              Order Reference
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-0.5">
              #{order.orderId}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold capitalize ${
              isCompleted
                ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                : isProcessing
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50'
                : 'bg-red-950 text-red-300 border border-red-500/50'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Item Info */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-900/30 space-y-3">
          <div className="text-base font-bold text-white">{order.serviceName}</div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono border-t border-purple-900/30 pt-3">
            <div>
              <span className="text-gray-500 block">Quantity</span>
              <span className="text-white font-bold">{order.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Unit Price</span>
              <span className="text-white font-bold">Rs. {order.unitPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Total Paid</span>
              <span className="text-purple-300 font-extrabold">Rs. {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Order Delivery Timeline */}
        <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-800/30 space-y-4">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            Fulfillment Timeline
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-900/60">
            {/* Step 1: Order Placed */}
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-slate-950 flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Order Placed</div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Step 2: Processing */}
            <div className="relative flex items-start gap-3">
              <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                isProcessing || isCompleted ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-500'
              }`}>
                <Clock className="w-2.5 h-2.5" />
              </div>
              <div>
                <div className={`text-xs font-bold ${isProcessing || isCompleted ? 'text-white' : 'text-gray-500'}`}>
                  Processing Order
                </div>
                <div className="text-[10px] text-gray-400">
                  {order.externalOrderId ? `API Integration ID: ${order.externalOrderId}` : 'Securing digital items...'}
                </div>
              </div>
            </div>

            {/* Step 3: Completed / Result */}
            <div className="relative flex items-start gap-3">
              <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-purple-500 text-white' : isCancelled ? 'bg-red-600 text-white' : 'bg-slate-800 text-gray-500'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-2.5 h-2.5" /> : isCancelled ? <XCircle className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
              </div>
              <div>
                <div className={`text-xs font-bold ${isCompleted ? 'text-purple-300' : isCancelled ? 'text-red-400' : 'text-gray-500'}`}>
                  {isCompleted ? 'Order Completed & Delivered' : isCancelled ? 'Order Cancelled' : 'Final Delivery'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {isCompleted ? 'Credentials/OTP service delivered to your account.' : 'Awaiting fulfillment completion.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

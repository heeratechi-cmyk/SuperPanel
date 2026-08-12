import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../services/db';
import { OrderRecord, OrderStatus } from '../types';
import { 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Loader2,
  PackageCheck
} from 'lucide-react';

interface OrdersProps {
  onNavigate: (route: string) => void;
}

export default function Orders({ onNavigate }: OrdersProps) {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (userProfile) {
      loadOrders();
    }
  }, [userProfile]);

  const loadOrders = async () => {
    if (!userProfile) return;
    setLoading(true);
    const list = await fetchUserOrders(userProfile.uid);
    setOrders(list);
    setLoading(false);
  };

  const statuses = ['All', 'pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'];

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'All' && ord.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = ord.orderId.toLowerCase().includes(q);
      const matchService = ord.serviceName.toLowerCase().includes(q);
      if (!matchId && !matchService) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-purple-400" />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold">
            <Clock className="w-3 h-3 text-indigo-400 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-gray-300 text-[10px] font-bold">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>Pending</span>
          </span>
        );
      case 'cancelled':
      case 'failed':
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500/40 text-red-300 text-[10px] font-bold capitalize">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>{status}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Orders</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            View real-time status and delivery for all your purchases
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/40 text-purple-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Service name..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-purple-900/50 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500 shadow-xl"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 border border-purple-400/30'
                  : 'bg-slate-900/80 text-gray-400 hover:text-white border border-purple-900/30'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-purple-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-medium">Fetching orders from SuperPanel...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-3">
          <PackageCheck className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            No purchases match your selected filter. Browse our catalog to place your first order.
          </p>
          <button
            onClick={() => onNavigate('/services')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/50"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((ord) => (
              <div
                key={ord.orderId}
                onClick={() => onNavigate(`/order/${ord.orderId}`)}
                className="p-5 rounded-2xl bg-slate-900/80 border border-purple-900/40 hover:border-purple-500/50 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300">
                    #{ord.orderId}
                  </span>
                  {getStatusBadge(ord.status)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{ord.serviceName}</h3>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between font-mono">
                    <span>Qty: {ord.quantity}</span>
                    <span className="font-bold text-white">Rs. {ord.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-900/20 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>{new Date(ord.createdAt).toLocaleString()}</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto rounded-3xl bg-slate-900/80 border border-purple-900/40 shadow-xl backdrop-blur-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-gray-400 uppercase tracking-wider font-mono border-b border-purple-900/30">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.orderId}
                    onClick={() => onNavigate(`/order/${ord.orderId}`)}
                    className="hover:bg-purple-950/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-purple-300">
                      #{ord.orderId}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {ord.serviceName}
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono">
                      {ord.quantity}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-white font-mono">
                      Rs. {ord.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-purple-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

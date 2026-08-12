import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AdminUserListItem,
  AdminUserDetailResponse,
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUserDetails,
  adminAddBalance,
  adminRemoveBalance,
  adminBlockUser,
  adminUnblockUser,
  adminDeactivateUser,
  fetchAdminDeposits,
  adminApproveDeposit,
  adminRejectDeposit,
  fetchAdminPaymentMethods,
  saveAdminPaymentMethod,
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminTransactions,
  fetchApiProviders,
  saveApiProvider,
  deleteApiProvider,
  testApiProvider,
  sendAnnouncement,
  fetchSmtpSettings,
  testSmtpServer,
  sendTestEmailMessage,
  fetchAuditLogs
} from '../services/admin';
import {
  fetchServices,
  saveService,
  fetchAllTickets,
  addTicketReply
} from '../services/db';
import {
  AdminStats,
  DepositRecord,
  OrderRecord,
  SupportTicket,
  PaymentMethodConfig,
  ServiceItem,
  TransactionRecord,
  AuditLogItem,
  ApiProviderItem
} from '../types';
import {
  ShieldCheck,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  MessageSquare,
  CreditCard,
  Send,
  Mail,
  Server,
  FileText,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  X,
  ChevronRight,
  User,
  Activity,
  Layers,
  Settings,
  Bell
} from 'lucide-react';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'deposits'
  | 'wallet'
  | 'orders'
  | 'services'
  | 'apiProviders'
  | 'support'
  | 'notifications'
  | 'payments'
  | 'smtp'
  | 'auditLogs'
  | 'profile';

export default function AdminPanel() {
  const { userProfile, addToast, refreshUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [globalLoading, setGlobalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users Tab State
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Balance Modals
  const [addBalModalUser, setAddBalModalUser] = useState<AdminUserListItem | null>(null);
  const [addBalAmount, setAddBalAmount] = useState('');
  const [addBalReason, setAddBalReason] = useState('');

  const [remBalModalUser, setRemBalModalUser] = useState<AdminUserListItem | null>(null);
  const [remBalAmount, setRemBalAmount] = useState('');
  const [remBalReason, setRemBalReason] = useState('');

  // Deposits State
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [depositSearch, setDepositSearch] = useState('');
  const [approvingDep, setApprovingDep] = useState<DepositRecord | null>(null);
  const [rejectingDep, setRejectingDep] = useState<DepositRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Wallet / Transactions State
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [txSearch, setTxSearch] = useState('');

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Services State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);

  // API Providers State
  const [apiProviders, setApiProviders] = useState<ApiProviderItem[]>([]);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvUrl, setNewProvUrl] = useState('');
  const [newProvKey, setNewProvKey] = useState('');
  const [testTestingUrl, setTestTestingUrl] = useState<string | null>(null);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Notifications / Announcements State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [notifTargetUserId, setNotifTargetUserId] = useState('');

  // Payment Config State
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentMethodConfig[]>([]);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);

  // SMTP State
  const [smtpInfo, setSmtpInfo] = useState<any>(null);
  const [testEmailAddr, setTestEmailAddr] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Modal Loading State
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab]);

  const loadTabContent = async (tab: AdminTab) => {
    setGlobalLoading(true);
    try {
      if (tab === 'dashboard') {
        const [sData, dData, oData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminDeposits(),
          fetchAdminOrders()
        ]);
        setStats(sData);
        setDeposits(dData);
        setOrders(oData);
      } else if (tab === 'users') {
        const uList = await fetchAdminUsers(userSearch, userStatusFilter);
        setUsers(uList);
      } else if (tab === 'deposits') {
        const dList = await fetchAdminDeposits();
        setDeposits(dList);
      } else if (tab === 'wallet') {
        const tList = await fetchAdminTransactions();
        setTransactions(tList);
      } else if (tab === 'orders') {
        const oList = await fetchAdminOrders();
        setOrders(oList);
      } else if (tab === 'services') {
        const sList = await fetchServices();
        setServices(sList);
      } else if (tab === 'apiProviders') {
        const pList = await fetchApiProviders();
        setApiProviders(pList);
      } else if (tab === 'support') {
        const tkts = await fetchAllTickets();
        setTickets(tkts);
      } else if (tab === 'payments') {
        const pm = await fetchAdminPaymentMethods();
        setPaymentConfigs(pm);
      } else if (tab === 'smtp') {
        const sInfo = await fetchSmtpSettings();
        setSmtpInfo(sInfo);
      } else if (tab === 'auditLogs') {
        const logs = await fetchAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load data from PostgreSQL server.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    await loadTabContent(activeTab);
    await refreshUserProfile();
    setRefreshing(false);
    addToast('Admin panel synchronized with PostgreSQL database.', 'success');
  };

  // User details loader
  const handleOpenUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailLoading(true);
    try {
      const details = await fetchAdminUserDetails(userId);
      setSelectedUserDetail(details);
    } catch (err: any) {
      addToast(err.message || 'Failed to load user detail profile.', 'error');
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Add Balance
  const handleConfirmAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBalModalUser) return;
    const numAmt = parseFloat(addBalAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      addToast('Please enter a valid positive amount.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminAddBalance(addBalModalUser.id, numAmt, addBalReason);
      addToast(res.message, 'success');
      setAddBalModalUser(null);
      setAddBalAmount('');
      setAddBalReason('');
      loadTabContent(activeTab);
      if (selectedUserId) handleOpenUserDetail(selectedUserId);
    } catch (err: any) {
      addToast(err.message || 'Failed to add balance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Balance
  const handleConfirmRemoveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remBalModalUser) return;
    const numAmt = parseFloat(remBalAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      addToast('Please enter a valid positive amount.', 'error');
      return;
    }
    if (!remBalReason.trim()) {
      addToast('A reason is required to deduct user funds.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminRemoveBalance(remBalModalUser.id, numAmt, remBalReason);
      addToast(res.message, 'success');
      setRemBalModalUser(null);
      setRemBalAmount('');
      setRemBalReason('');
      loadTabContent(activeTab);
      if (selectedUserId) handleOpenUserDetail(selectedUserId);
    } catch (err: any) {
      addToast(err.message || 'Failed to remove balance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Block / Unblock / Deactivate
  const handleBlockUser = async (u: AdminUserListItem) => {
    if (!window.confirm(`Are you sure you want to BLOCK user ${u.name} (${u.email})? They will be immediately logged out and forbidden from logging in.`)) return;
    setActionLoading(true);
    try {
      const msg = await adminBlockUser(u.id);
      addToast(msg, 'success');
      loadTabContent(activeTab);
      if (selectedUserId) handleOpenUserDetail(selectedUserId);
    } catch (err: any) {
      addToast(err.message || 'Failed to block user.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (u: AdminUserListItem) => {
    setActionLoading(true);
    try {
      const msg = await adminUnblockUser(u.id);
      addToast(msg, 'success');
      loadTabContent(activeTab);
      if (selectedUserId) handleOpenUserDetail(selectedUserId);
    } catch (err: any) {
      addToast(err.message || 'Failed to unblock user.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Deposit Approve
  const handleConfirmApproveDeposit = async () => {
    if (!approvingDep) return;
    setActionLoading(true);
    try {
      const msg = await adminApproveDeposit(approvingDep.depositId);
      addToast(msg, 'success');
      setApprovingDep(null);
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Deposit Reject
  const handleConfirmRejectDeposit = async () => {
    if (!rejectingDep) return;
    if (!rejectionReason.trim()) {
      addToast('A rejection reason is strictly required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const msg = await adminRejectDeposit(rejectingDep.depositId, rejectionReason);
      addToast(msg, 'info');
      setRejectingDep(null);
      setRejectionReason('');
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Service
  const handleSaveServiceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name) return;
    setActionLoading(true);
    try {
      await saveService(editingService as any);
      addToast('Service saved to PostgreSQL database.', 'success');
      setEditingService(null);
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Failed to save service.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Payment Method
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setActionLoading(true);
    try {
      const msg = await saveAdminPaymentMethod({
        id: editingPayment.id,
        name: editingPayment.name,
        accountName: editingPayment.accountName,
        accountNumber: editingPayment.accountNumber,
        enabled: editingPayment.enabled
      });
      addToast(msg, 'success');
      setEditingPayment(null);
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Failed to save payment method.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save API Provider
  const handleSaveApiProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim() || !newProvUrl.trim()) {
      addToast('Provider Name and Base URL are required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const msg = await saveApiProvider(newProvName, newProvUrl, newProvKey);
      addToast(msg, 'success');
      setShowAddProviderModal(false);
      setNewProvName('');
      setNewProvUrl('');
      setNewProvKey('');
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Failed to save API provider.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestApiProvider = async (url: string) => {
    setTestTestingUrl(url);
    try {
      const msg = await testApiProvider(url);
      addToast(msg, 'success');
    } catch (err: any) {
      addToast(err.message || 'Test failed.', 'error');
    } finally {
      setTestTestingUrl(null);
    }
  };

  // Send Notification Broadcast
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      addToast('Title and Message are required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const msg = await sendAnnouncement(
        notifTitle,
        notifMessage,
        notifTarget,
        notifTarget === 'SPECIFIC' ? notifTargetUserId : undefined
      );
      addToast(msg, 'success');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      addToast(err.message || 'Failed to send broadcast.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Test SMTP Connection
  const handleTestSmtp = async () => {
    setActionLoading(true);
    try {
      const msg = await testSmtpServer();
      addToast(msg, 'success');
    } catch (err: any) {
      addToast(err.message || 'SMTP Connection Test Failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setActionLoading(true);
    try {
      const msg = await sendTestEmailMessage(testEmailAddr || userProfile?.email);
      addToast(msg, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to send test email.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const msg = await updateAdminOrderStatus(orderId, newStatus);
      addToast(msg, 'success');
      loadTabContent(activeTab);
    } catch (err: any) {
      addToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Support Reply
  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim()) return;
    setActionLoading(true);
    try {
      await addTicketReply(activeTicket.ticketId, userProfile!.uid, userProfile!.name, 'admin', ticketReplyText);
      addToast('Reply sent to user support ticket.', 'success');
      setTicketReplyText('');
      const tkts = await fetchAllTickets();
      setTickets(tkts);
      const updated = tkts.find(t => t.ticketId === activeTicket.ticketId);
      if (updated) setActiveTicket(updated);
    } catch (err: any) {
      addToast(err.message || 'Failed to send reply.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-slate-100">
      {/* Admin Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              SuperPanel <span className="text-purple-400 text-sm font-bold bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/30">ADMIN PANEL</span>
            </h1>
            <p className="text-xs text-slate-400">
              PostgreSQL Database Operations · Authenticated Session ({userProfile?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-lg hover:shadow-purple-900/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Dashboard
          </button>
        </div>
      </div>

      {/* Main Admin Content Grid with Sidebar Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Admin Navigation Bar */}
        <div className="lg:col-span-3 space-y-2 bg-slate-900/90 border border-slate-800 p-3 rounded-3xl shadow-xl h-fit">
          <p className="px-3 py-2 text-[11px] font-bold tracking-wider text-purple-400 uppercase">
            Administrative Menu
          </p>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity, count: null },
            { id: 'users', label: 'Users', icon: Users, count: stats?.totalUsers },
            { id: 'deposits', label: 'Deposits', icon: Wallet, count: stats?.pendingDeposits ? `${stats.pendingDeposits} Pending` : null, highlight: Boolean(stats?.pendingDeposits) },
            { id: 'wallet', label: 'Transactions', icon: FileText, count: null },
            { id: 'orders', label: 'Orders', icon: Layers, count: stats?.totalOrders },
            { id: 'services', label: 'Services', icon: Server, count: null },
            { id: 'apiProviders', label: 'API Providers', icon: Settings, count: null },
            { id: 'support', label: 'Support Tickets', icon: MessageSquare, count: null },
            { id: 'notifications', label: 'Announcements', icon: Bell, count: null },
            { id: 'payments', label: 'Payment Methods', icon: CreditCard, count: null },
            { id: 'smtp', label: 'SMTP / Email', icon: Mail, count: null },
            { id: 'auditLogs', label: 'Audit Logs', icon: Clock, count: null },
            { id: 'profile', label: 'Admin Profile', icon: User, count: null }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedUserId(null);
                  setActiveTab(item.id as AdminTab);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      item.highlight
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isActive
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Container */}
        <div className="lg:col-span-9 min-w-0">
          {globalLoading ? (
            <div className="p-12 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-purple-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono font-bold">Querying PostgreSQL Database...</p>
            </div>
          ) : (
            <>
              {/* ==================== 1. DASHBOARD TAB ==================== */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Banner summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-900/40 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Total Registered Users</p>
                      <p className="text-2xl font-black text-white font-mono">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {stats.activeUsers} Active
                      </p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-900/40 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Pending Deposits</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{stats.pendingDeposits}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Requires Admin Manual Review</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-900/40 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Approved Deposits Total</p>
                      <p className="text-2xl font-black text-purple-300 font-mono">Rs. {stats.totalDepositsAmount.toLocaleString()}</p>
                      <p className="text-[11px] text-purple-400 font-medium">{stats.approvedDeposits} Approved</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/90 border border-indigo-900/40 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Total Wallet Balance Sum</p>
                      <p className="text-2xl font-black text-indigo-400 font-mono">Rs. {stats.totalWalletBalance.toLocaleString()}</p>
                      <p className="text-[11px] text-indigo-300 font-medium">Across all accounts</p>
                    </div>
                  </div>

                  {/* Orders & Deposits Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" /> Order Fulfillment Stats
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">{stats.totalOrders} Total</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40">
                          <p className="text-xs text-amber-400 font-bold">Pending</p>
                          <p className="text-lg font-bold text-white font-mono">{stats.pendingOrders}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                          <p className="text-xs text-emerald-400 font-bold">Completed</p>
                          <p className="text-lg font-bold text-white font-mono">{stats.completedOrders}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40">
                          <p className="text-xs text-rose-400 font-bold">Failed</p>
                          <p className="text-lg font-bold text-white font-mono">{stats.failedOrders}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" /> Account Status Overview
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">{stats.totalUsers} Total</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                          <p className="text-xs text-emerald-400 font-bold">Active Accounts</p>
                          <p className="text-lg font-bold text-white font-mono">{stats.activeUsers}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40">
                          <p className="text-xs text-rose-400 font-bold">Blocked Accounts</p>
                          <p className="text-lg font-bold text-white font-mono">{stats.blockedUsers}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Deposit Submissions Section */}
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-400" /> Recent Deposit Requests
                      </h3>
                      <button
                        onClick={() => setActiveTab('deposits')}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {deposits.slice(0, 5).map((dep) => (
                      <div key={dep.depositId} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-white">Deposit #{dep.depositId} — Rs. {dep.amount.toLocaleString()}</p>
                          <p className="text-slate-400">{dep.userEmail || dep.userName} · {dep.paymentMethod} ({dep.transactionId})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (dep.status as string) === 'APPROVED' || (dep.status as string) === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            (dep.status as string) === 'REJECTED' || (dep.status as string) === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}>
                            {dep.status}
                          </span>
                          {((dep.status as string) === 'PENDING' || (dep.status as string) === 'pending') && (
                            <button
                              onClick={() => setApprovingDep(dep)}
                              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== 2. USERS MANAGEMENT TAB ==================== */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {selectedUserDetail ? (
                    /* USER DETAIL VIEW */
                    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedUserDetail(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2"
                        >
                          ← Back to Users List
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const uItem = users.find(u => u.id === selectedUserDetail.id);
                              if (uItem) setAddBalModalUser(uItem);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Add Balance
                          </button>
                          <button
                            onClick={() => {
                              const uItem = users.find(u => u.id === selectedUserDetail.id);
                              if (uItem) setRemBalModalUser(uItem);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Remove Balance
                          </button>
                        </div>
                      </div>

                      {/* Header user info card */}
                      <div className="p-6 rounded-2xl bg-slate-950 border border-purple-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {selectedUserDetail.name}
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${
                              selectedUserDetail.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {selectedUserDetail.status}
                            </span>
                          </h2>
                          <p className="text-xs text-slate-400 font-mono mt-1">{selectedUserDetail.email} · ID: {selectedUserDetail.id}</p>
                          <p className="text-xs text-purple-400 mt-2 font-mono">
                            Email Verified: {selectedUserDetail.emailVerified ? 'YES' : 'NO'} · Joined: {new Date(selectedUserDetail.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Current Wallet Balance</p>
                          <p className="text-2xl font-black text-purple-300 font-mono">Rs. {selectedUserDetail.walletBalance.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Orders & Deposits History Tabs */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white">Order History ({selectedUserDetail.orders.length})</h3>
                        <div className="overflow-x-auto rounded-2xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                              <tr>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Service</th>
                                <th className="p-3">Qty</th>
                                <th className="p-3">Total</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {selectedUserDetail.orders.map((o: any) => (
                                <tr key={o.id} className="hover:bg-slate-800/40">
                                  <td className="p-3 font-mono text-purple-300">{o.orderId}</td>
                                  <td className="p-3 text-white font-bold">{o.serviceName}</td>
                                  <td className="p-3">{o.quantity}</td>
                                  <td className="p-3 font-mono">Rs. {o.total}</td>
                                  <td className="p-3 font-bold text-purple-400">{o.status}</td>
                                </tr>
                              ))}
                              {selectedUserDetail.orders.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-500">No orders placed by this user yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ALL USERS LIST TABLE */
                    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-72">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Search name, email, or ID..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadTabContent('users')}
                            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {['ALL', 'ACTIVE', 'BLOCKED', 'VERIFIED'].map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                setUserStatusFilter(st);
                                fetchAdminUsers(userSearch, st).then(setUsers);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                userStatusFilter === st
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Users Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                            <tr>
                              <th className="p-3.5">User</th>
                              <th className="p-3.5">Role</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5">Wallet</th>
                              <th className="p-3.5">Orders</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {users.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5">
                                  <div className="font-bold text-white">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                                </td>
                                <td className="p-3.5 font-mono">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-300'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    u.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                                  }`}>
                                    {u.status}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono font-bold text-purple-300">
                                  Rs. {u.walletBalance.toLocaleString()}
                                </td>
                                <td className="p-3.5 font-mono">{u.totalOrders}</td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenUserDetail(u.id)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                      title="View User Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setAddBalModalUser(u)}
                                      className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[11px] font-bold"
                                      title="Add Balance"
                                    >
                                      + Balance
                                    </button>
                                    <button
                                      onClick={() => setRemBalModalUser(u)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold"
                                      title="Remove Balance"
                                    >
                                      - Balance
                                    </button>
                                    {u.status === 'ACTIVE' ? (
                                      <button
                                        onClick={() => handleBlockUser(u)}
                                        className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800"
                                        title="Block User"
                                      >
                                        <Lock className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUnblockUser(u)}
                                        className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800"
                                        title="Unblock User"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {users.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                  No registered users found matching filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== 3. DEPOSITS TAB ==================== */}
              {activeTab === 'deposits' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-center gap-3 text-amber-300 text-xs font-medium">
                    <Clock className="w-5 h-5 shrink-0 text-amber-400" />
                    <p>
                      <strong>24-Hour Review Window:</strong> Deposit requests submitted by users require manual backend verification against bank receipts before approving funds.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Search Deposit ID, Tx ID, Email..."
                          value={depositSearch}
                          onChange={(e) => setDepositSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setDepositFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              depositFilter === st
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Deposit Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="p-3.5">Deposit ID</th>
                            <th className="p-3.5">User</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Method / Tx ID</th>
                            <th className="p-3.5">Proof</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {deposits
                            .filter((d) => {
                              if (depositFilter !== 'ALL' && (d.status as string).toUpperCase() !== depositFilter) return false;
                              if (depositSearch) {
                                const q = depositSearch.toLowerCase();
                                return (
                                  d.depositId.toLowerCase().includes(q) ||
                                  d.transactionId.toLowerCase().includes(q) ||
                                  (d.userEmail && d.userEmail.toLowerCase().includes(q))
                                );
                              }
                              return true;
                            })
                            .map((d) => (
                              <tr key={d.depositId} className="hover:bg-slate-800/40">
                                <td className="p-3.5 font-mono font-bold text-purple-300">#{d.depositId}</td>
                                <td className="p-3.5">
                                  <div className="font-bold text-white">{d.userName}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{d.userEmail}</div>
                                </td>
                                <td className="p-3.5 font-mono font-bold text-emerald-400">
                                  Rs. {d.amount.toLocaleString()}
                                </td>
                                <td className="p-3.5 font-mono text-[11px]">
                                  <span className="font-bold text-purple-300">{d.paymentMethod}</span>
                                  <div className="text-slate-400">Tx: {d.transactionId}</div>
                                  <div className="text-slate-500">Sender: {d.senderName}</div>
                                </td>
                                <td className="p-3.5">
                                  {d.screenshotUrl ? (
                                    <button
                                      onClick={() => setPreviewScreenshot(d.screenshotUrl)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800 text-[11px] font-bold flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" /> View Proof
                                    </button>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">No Screenshot</span>
                                  )}
                                </td>
                                <td className="p-3.5 font-mono">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    (d.status as string).toUpperCase() === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                    (d.status as string).toUpperCase() === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                    'bg-blue-950 text-blue-400 border border-blue-800'
                                  }`}>
                                    {d.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  {(d.status as string).toUpperCase() === 'PENDING' ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setApprovingDep(d)}
                                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => setRejectingDep(d)}
                                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">Processed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 4. WALLET & TRANSACTIONS TAB ==================== */}
              {activeTab === 'wallet' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" /> Immutable Wallet Transaction Ledger
                      </h2>
                      <p className="text-xs text-slate-400">All financial adjustments, deposits, and debits recorded in PostgreSQL.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3.5">User</th>
                          <th className="p-3.5">Type</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Balance Before → After</th>
                          <th className="p-3.5">Description</th>
                          <th className="p-3.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5">
                              <div className="font-bold text-white font-sans">{(tx as any).userName || tx.userId}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{(tx as any).userEmail}</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                (tx.type as string) === 'DEPOSIT' || (tx.type as string) === 'ADMIN_CREDIT' || (tx.type as string) === 'deposit' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-white">Rs. {tx.amount.toLocaleString()}</td>
                            <td className="p-3.5 text-slate-400">
                              Rs. {tx.balanceBefore?.toLocaleString()} → <span className="text-purple-300 font-bold">Rs. {tx.balanceAfter?.toLocaleString()}</span>
                            </td>
                            <td className="p-3.5 text-slate-300 font-sans">{tx.description}</td>
                            <td className="p-3.5 text-slate-500 text-[11px]">
                              {new Date((tx as any).createdAt || tx.date).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 5. ORDERS TAB ==================== */}
              {activeTab === 'orders' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" /> Order Fulfillment Engine
                    </h2>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3.5">Order ID</th>
                          <th className="p-3.5">User</th>
                          <th className="p-3.5">Service</th>
                          <th className="p-3.5">Qty / Total</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {orders.map((ord) => (
                          <tr key={ord.orderId} className="hover:bg-slate-800/40">
                            <td className="p-3.5 font-mono font-bold text-purple-300">#{ord.orderId}</td>
                            <td className="p-3.5">
                              <div className="font-bold text-white">{ord.userName || ord.userId}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{ord.userEmail}</div>
                            </td>
                            <td className="p-3.5 font-bold text-white">{ord.serviceName}</td>
                            <td className="p-3.5 font-mono">
                              <div>Qty: {ord.quantity}</div>
                              <div className="text-purple-300 font-bold">Rs. {ord.totalAmount?.toLocaleString() || ord.unitPrice * ord.quantity}</div>
                            </td>
                            <td className="p-3.5 font-mono">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value)}
                                className="px-2.5 py-1 rounded-xl bg-slate-950 border border-purple-800 text-xs text-purple-300 font-bold focus:outline-none"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="FAILED">FAILED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 6. SERVICES TAB ==================== */}
              {activeTab === 'services' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-400" /> Service Catalog Management
                    </h2>
                    <button
                      onClick={() => setEditingService({ name: '', category: 'Digital Services', price: 100, stock: 999999, status: 'active', description: '' })}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add New Service
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3.5">Service Name</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Price (PKR)</th>
                          <th className="p-3.5">Stock</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {services.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5 font-bold text-white">{s.name}</td>
                            <td className="p-3.5 text-slate-400">{s.category}</td>
                            <td className="p-3.5 font-mono font-bold text-emerald-400">Rs. {s.price}</td>
                            <td className="p-3.5 font-mono">{s.stock.toLocaleString()}</td>
                            <td className="p-3.5 font-mono">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => setEditingService(s)}
                                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800 text-[11px] font-bold"
                              >
                                Edit Service
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 7. API PROVIDERS TAB ==================== */}
              {activeTab === 'apiProviders' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-400" /> External API Provider Integrations
                      </h2>
                      <p className="text-xs text-slate-400">Configure external SMM panel providers. API keys are masked and stored securely.</p>
                    </div>
                    <button
                      onClick={() => setShowAddProviderModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add API Provider
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3.5">Provider Name</th>
                          <th className="p-3.5">Base API URL</th>
                          <th className="p-3.5">API Key</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {apiProviders.map((prov) => (
                          <tr key={prov.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5 font-bold text-white font-sans">{prov.name}</td>
                            <td className="p-3.5 text-slate-300">{prov.baseUrl}</td>
                            <td className="p-3.5 text-slate-500">{prov.apiKeyMasked || '••••••••••••••••'}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                ACTIVE
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-sans">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleTestApiProvider(prov.baseUrl)}
                                  disabled={testTestingUrl === prov.baseUrl}
                                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800 text-[11px] font-bold flex items-center gap-1"
                                >
                                  {testTestingUrl === prov.baseUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test Connection'}
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Delete API provider ${prov.name}?`)) {
                                      await deleteApiProvider(prov.id);
                                      addToast('API provider removed.', 'info');
                                      loadTabContent('apiProviders');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {apiProviders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              No external API providers configured.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 8. SUPPORT TICKETS TAB ==================== */}
              {activeTab === 'support' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" /> Support Desk Management
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Tickets List */}
                    <div className="lg:col-span-5 space-y-2 border-r border-slate-800 pr-4">
                      {tickets.map((t) => (
                        <button
                          key={t.ticketId}
                          onClick={() => setActiveTicket(t)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                            activeTicket?.ticketId === t.ticketId
                              ? 'bg-purple-950/80 border-purple-500/50 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-300 font-mono">#{t.ticketId}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800">{t.status}</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1">{t.subject}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.userName} ({t.userEmail})</p>
                        </button>
                      ))}
                      {tickets.length === 0 && (
                        <p className="text-xs text-slate-500 p-4 text-center">No support tickets found.</p>
                      )}
                    </div>

                    {/* Active Ticket Conversation */}
                    <div className="lg:col-span-7 space-y-4">
                      {activeTicket ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                            <p className="text-xs font-mono text-purple-300">Ticket #{activeTicket.ticketId}</p>
                            <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                            <p className="text-xs text-slate-400">{activeTicket.userName} ({activeTicket.userEmail})</p>
                          </div>

                          <div className="space-y-3 max-h-80 overflow-y-auto p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                            {activeTicket.messages?.map((m: any, idx: number) => (
                              <div
                                key={m.id || idx}
                                className={`p-3 rounded-2xl text-xs max-w-md ${
                                  m.senderRole === 'admin'
                                    ? 'bg-purple-600 text-white ml-auto'
                                    : 'bg-slate-800 text-slate-200'
                                }`}
                              >
                                <p className="font-bold text-[10px] text-purple-200 mb-1">{m.senderName} ({m.senderRole})</p>
                                <p>{m.text || m.message}</p>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={handleSendSupportReply} className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Write reply to user..."
                              value={ticketReplyText}
                              onChange={(e) => setTicketReplyText(e.target.value)}
                              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-purple-800 text-xs text-white focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" /> Reply
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-slate-500 text-xs">
                          Select a support ticket from the list to view conversation and reply.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 9. ANNOUNCEMENTS TAB ==================== */}
              {activeTab === 'notifications' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 max-w-2xl mx-auto">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" /> Global System Broadcast & Notifications
                  </h2>

                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Target Audience</label>
                      <select
                        value={notifTarget}
                        onChange={(e) => setNotifTarget(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                      >
                        <option value="ALL">All Active Users</option>
                        <option value="SPECIFIC">Specific User ID</option>
                      </select>
                    </div>

                    {notifTarget === 'SPECIFIC' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Target User ID</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. usr_12345"
                          value={notifTargetUserId}
                          onChange={(e) => setNotifTargetUserId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Scheduled System Maintenance"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Message Content</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Enter announcement text..."
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                    >
                      {actionLoading ? 'Broadcasting...' : 'Dispatch Announcement'}
                    </button>
                  </form>
                </div>
              )}

              {/* ==================== 10. PAYMENT METHODS TAB ==================== */}
              {activeTab === 'payments' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" /> Payment Gateway Configuration (JazzCash / SadaPay)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentConfigs.map((pm) => (
                      <div key={pm.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">{pm.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pm.enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                            {pm.enabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                          <p className="text-slate-400">Account Number: <span className="text-purple-300 font-bold">{pm.accountNumber}</span></p>
                          <p className="text-slate-400">Account Name: <span className="text-white font-bold">{pm.accountName}</span></p>
                        </div>
                        <button
                          onClick={() => setEditingPayment(pm)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800 text-xs font-bold"
                        >
                          Edit Gateway Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== 11. SMTP TAB ==================== */}
              {activeTab === 'smtp' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 max-w-2xl mx-auto">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" /> SMTP Email Server Configuration
                  </h2>

                  {smtpInfo && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                      <p><span className="text-slate-400">Host:</span> <span className="text-purple-300 font-bold">{smtpInfo.smtpHost}</span></p>
                      <p><span className="text-slate-400">Port:</span> <span className="text-white font-bold">{smtpInfo.smtpPort}</span></p>
                      <p><span className="text-slate-400">From Address:</span> <span className="text-emerald-400 font-bold">{smtpInfo.smtpFrom}</span></p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleTestSmtp}
                      disabled={actionLoading}
                      className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800 font-bold text-xs"
                    >
                      Test SMTP Server Connection
                    </button>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="email"
                        placeholder="Recipient test email..."
                        value={testEmailAddr}
                        onChange={(e) => setTestEmailAddr(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleSendTestEmail}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        Send Test Email
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 12. AUDIT LOGS TAB ==================== */}
              {activeTab === 'auditLogs' && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" /> Immutable Administrative Audit Trail
                  </h2>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">Action</th>
                          <th className="p-3.5">Admin</th>
                          <th className="p-3.5">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5 text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3.5 font-sans font-bold text-white">{log.adminName || log.adminId}</td>
                            <td className="p-3.5 text-slate-300 font-sans">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 13. ADMIN PROFILE TAB ==================== */}
              {activeTab === 'profile' && userProfile && (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 max-w-xl mx-auto">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-2xl">
                      {userProfile.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{userProfile.name}</h2>
                      <p className="text-xs text-slate-400 font-mono">{userProfile.email}</p>
                      <span className="mt-1 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        VERIFIED SUPERADMIN
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                    <p className="text-slate-400">User ID: <span className="text-white">{userProfile.uid}</span></p>
                    <p className="text-slate-400">Account Status: <span className="text-emerald-400 font-bold">{userProfile.status.toUpperCase()}</span></p>
                    <p className="text-slate-400">Session Role: <span className="text-purple-300 font-bold">ADMIN</span></p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* ADD BALANCE MODAL */}
      {addBalModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-purple-400" /> Admin Add Wallet Balance
              </h3>
              <button onClick={() => setAddBalModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <p className="text-slate-400">User: <strong className="text-white">{addBalModalUser.name}</strong> ({addBalModalUser.email})</p>
              <p className="text-slate-400">Current Balance: <strong className="text-purple-300 font-mono">Rs. {addBalModalUser.walletBalance.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handleConfirmAddBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Amount to Add (PKR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={addBalAmount}
                  onChange={(e) => setAddBalAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Bank transfer manually verified"
                  value={addBalReason}
                  onChange={(e) => setAddBalReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddBalModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Credit Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE BALANCE MODAL */}
      {remBalModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-rose-400" /> Admin Remove Balance
              </h3>
              <button onClick={() => setRemBalModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <p className="text-slate-400">User: <strong className="text-white">{remBalModalUser.name}</strong> ({remBalModalUser.email})</p>
              <p className="text-slate-400">Current Balance: <strong className="text-rose-300 font-mono">Rs. {remBalModalUser.walletBalance.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handleConfirmRemoveBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Amount to Deduct (PKR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 200"
                  value={remBalAmount}
                  onChange={(e) => setRemBalAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mandatory Reason <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order refund reversal / chargeback"
                  value={remBalReason}
                  onChange={(e) => setRemBalReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRemBalModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
                >
                  {actionLoading ? 'Deducting...' : 'Confirm Deduct Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE DEPOSIT CONFIRM MODAL */}
      {approvingDep && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Approve Deposit #{approvingDep.depositId}?</h3>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <p className="text-slate-400">User: <strong className="text-white">{approvingDep.userName}</strong> ({approvingDep.userEmail})</p>
              <p className="text-slate-400">Amount: <strong className="text-emerald-400 font-mono">Rs. {approvingDep.amount.toLocaleString()}</strong></p>
              <p className="text-slate-400">Method: <strong>{approvingDep.paymentMethod}</strong> (Tx: {approvingDep.transactionId})</p>
            </div>
            <p className="text-[11px] text-amber-400">
              ⚡ Safe backend lock will prevent duplicate approval. Approving will credit Rs. {approvingDep.amount.toLocaleString()} directly to user wallet and send notification email.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setApprovingDep(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproveDeposit}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DEPOSIT MODAL */}
      {rejectingDep && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/50 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Reject Deposit #{rejectingDep.depositId}</h3>
            <p className="text-xs text-slate-400">Amount: Rs. {rejectingDep.amount.toLocaleString()} · User: {rejectingDep.userEmail}</p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rejection Reason <span className="text-rose-400">*</span></label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Transaction ID not found in bank statement"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingDep(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectDeposit}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT PROOF MODAL */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-4 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white">Deposit Proof Screenshot</h3>
              <button onClick={() => setPreviewScreenshot(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-2 flex justify-center">
              <img src={previewScreenshot} alt="Deposit Proof" className="max-w-full h-auto rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD SERVICE MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{editingService.id ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={editingService.category || 'Digital Services'}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Buy Account">Buy Account</option>
                  <option value="Virtual Numbers">Virtual Numbers</option>
                  <option value="Social Media Services">Social Media Services</option>
                  <option value="Digital Services">Digital Services</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editingService.price || 0}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingService.stock || 0}
                    onChange={(e) => setEditingService({ ...editingService, stock: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingService.status !== 'inactive'}
                  onChange={(e) => setEditingService({ ...editingService, status: e.target.checked ? 'active' : 'inactive' })}
                />
                <label htmlFor="activeCheck" className="text-slate-300 font-bold">Active in Customer Service Catalog</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT CONFIG MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edit {editingPayment.name} Gateway</h3>
              <button onClick={() => setEditingPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Account Number / Phone</label>
                <input
                  type="text"
                  required
                  value={editingPayment.accountNumber}
                  onChange={(e) => setEditingPayment({ ...editingPayment, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Account Title / Name</label>
                <input
                  type="text"
                  required
                  value={editingPayment.accountName}
                  onChange={(e) => setEditingPayment({ ...editingPayment, accountName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pmEnable"
                  checked={editingPayment.enabled}
                  onChange={(e) => setEditingPayment({ ...editingPayment, enabled: e.target.checked })}
                />
                <label htmlFor="pmEnable" className="text-slate-300 font-bold">Enable this payment method for deposit submissions</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD API PROVIDER MODAL */}
      {showAddProviderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add External API Provider</h3>
              <button onClick={() => setShowAddProviderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApiProvider} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JustAnotherPanel"
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Base API URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://provider-domain.com/api/v2"
                  value={newProvUrl}
                  onChange={(e) => setNewProvUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Enter API Key secret"
                  value={newProvKey}
                  onChange={(e) => setNewProvKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProviderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save API Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

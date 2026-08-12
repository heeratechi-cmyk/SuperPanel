import { 
  AdminStats, 
  AuditLogItem, 
  ApiProviderItem, 
  PaymentMethodConfig, 
  DepositRecord, 
  OrderRecord, 
  SupportTicket, 
  TransactionRecord 
} from '../types';

function getAuthHeaders(contentType: string | null = 'application/json'): Record<string, string> {
  const token = localStorage.getItem('superpanel_session');
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  walletBalance: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalDeposits: number;
}

export interface AdminUserDetailResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  walletBalance: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  orders: any[];
  deposits: any[];
  transactions: any[];
  tickets: any[];
}

// 1. Stats
export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch admin statistics.');
  return data.stats;
}

// 2. Users
export async function fetchAdminUsers(q = '', status = 'ALL'): Promise<AdminUserListItem[]> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status && status !== 'ALL') params.set('status', status);

  const res = await fetch(`/api/admin/users?${params.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch users.');
  return data.users || [];
}

export async function fetchAdminUserDetails(id: string): Promise<AdminUserDetailResponse> {
  const res = await fetch(`/api/admin/users/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch user details.');
  return data.user;
}

// 3. Balance adjustments
export async function adminAddBalance(userId: string, amount: number, reason: string): Promise<{ success: boolean; message: string; newBalance?: number }> {
  const res = await fetch(`/api/admin/users/${userId}/add-balance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ amount, reason })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to add balance.');
  return data;
}

export async function adminRemoveBalance(userId: string, amount: number, reason: string): Promise<{ success: boolean; message: string; newBalance?: number }> {
  const res = await fetch(`/api/admin/users/${userId}/remove-balance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ amount, reason })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to remove balance.');
  return data;
}

// 4. Block / Unblock / Deactivate
export async function adminBlockUser(userId: string): Promise<string> {
  const res = await fetch(`/api/admin/users/${userId}/block`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to block user.');
  return data.message;
}

export async function adminUnblockUser(userId: string): Promise<string> {
  const res = await fetch(`/api/admin/users/${userId}/unblock`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to unblock user.');
  return data.message;
}

export async function adminDeactivateUser(userId: string): Promise<string> {
  const res = await fetch(`/api/admin/users/${userId}/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to deactivate user.');
  return data.message;
}

// 5. Deposits
export async function fetchAdminDeposits(): Promise<DepositRecord[]> {
  const res = await fetch('/api/admin/deposits', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch deposits.');
  return data.deposits || [];
}

export async function adminApproveDeposit(id: string): Promise<string> {
  const res = await fetch(`/api/admin/deposits/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to approve deposit.');
  return data.message;
}

export async function adminRejectDeposit(id: string, rejectionReason: string): Promise<string> {
  const res = await fetch(`/api/admin/deposits/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ rejectionReason })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to reject deposit.');
  return data.message;
}

// 6. Payment Methods
export async function fetchAdminPaymentMethods(): Promise<PaymentMethodConfig[]> {
  const res = await fetch('/api/admin/payment-methods', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch payment methods.');
  return data.methods || [];
}

export async function saveAdminPaymentMethod(config: { id?: string; name?: string; accountName: string; accountNumber: string; enabled: boolean }): Promise<string> {
  const res = await fetch('/api/admin/payment-methods', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(config)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to save payment method.');
  return data.message;
}

// 7. Orders
export async function fetchAdminOrders(): Promise<OrderRecord[]> {
  const res = await fetch('/api/admin/orders', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch admin orders.');
  return data.orders || [];
}

export async function updateAdminOrderStatus(orderId: string, status: string): Promise<string> {
  const res = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update order status.');
  return data.message;
}

// 8. Transactions
export async function fetchAdminTransactions(): Promise<TransactionRecord[]> {
  const res = await fetch('/api/admin/transactions', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch wallet transactions.');
  return data.transactions || [];
}

// 9. API Providers
export async function fetchApiProviders(): Promise<ApiProviderItem[]> {
  const res = await fetch('/api/admin/api-integrations', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch API providers.');
  return data.integrations || [];
}

export async function saveApiProvider(name: string, baseUrl: string, apiKey?: string): Promise<string> {
  const res = await fetch('/api/admin/api-integrations', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ name, baseUrl, apiKey })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to save API provider.');
  return data.message;
}

export async function deleteApiProvider(id: string): Promise<string> {
  const res = await fetch(`/api/admin/api-integrations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete provider.');
  return data.message;
}

export async function testApiProvider(baseUrl: string): Promise<string> {
  const res = await fetch('/api/admin/api-integrations/test', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ baseUrl })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API Provider test failed.');
  return data.message;
}

// 10. Announcements
export async function sendAnnouncement(title: string, message: string, target = 'ALL', userId?: string): Promise<string> {
  const res = await fetch('/api/admin/notifications/send', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ title, message, target, userId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to send announcement.');
  return data.message;
}

// 11. Email / SMTP
export async function fetchSmtpSettings(): Promise<any> {
  const res = await fetch('/api/admin/settings/email', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch SMTP settings.');
  return data.emailSettings;
}

export async function testSmtpServer(): Promise<string> {
  const res = await fetch('/api/admin/settings/email/test-smtp', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'SMTP Connection Test Failed.');
  return data.message;
}

export async function sendTestEmailMessage(email?: string): Promise<string> {
  const res = await fetch('/api/admin/settings/email/send-test', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to send test email.');
  return data.message;
}

// 12. Audit Logs
export async function fetchAuditLogs(): Promise<AuditLogItem[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch audit logs.');
  return data.logs || [];
}

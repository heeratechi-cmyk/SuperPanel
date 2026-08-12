import { 
  ServiceItem, 
  OrderRecord, 
  DepositRecord, 
  TransactionRecord, 
  SupportTicket, 
  NotificationItem, 
  PaymentMethodConfig,
  UserProfile
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

// ==================== SERVICES ====================
export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const res = await fetch('/api/services', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.services)) {
      return data.services.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        price: s.price,
        stock: s.stock,
        status: s.active ? 'active' : 'inactive',
        icon: 'Sparkles',
        createdAt: s.createdAt,
      }));
    }
    return [];
  } catch (err) {
    console.error('Error fetching services:', err);
    return [];
  }
}

export async function fetchServiceById(serviceId: string): Promise<ServiceItem | null> {
  const services = await fetchServices();
  return services.find(s => s.id === serviceId) || null;
}

export async function saveService(service: Partial<ServiceItem> & { name: string }): Promise<string> {
  if (service.id) {
    const res = await fetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        stock: service.stock,
        active: service.status === 'active'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to update service.');
    return service.id;
  } else {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: service.name,
        description: service.description || '',
        category: service.category || 'Digital Services',
        price: service.price || 0,
        stock: service.stock || 999999,
        active: service.status !== 'inactive'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to create service.');
    return data.serviceId;
  }
}

// ==================== ORDERS ====================
export async function placeOrder(userId: string, serviceId: string, quantity: number, link?: string): Promise<{ success: boolean; orderId?: string; message?: string }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ serviceId, quantity, link })
    });

    const data = await res.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Failed to place order.' };
    }

    return {
      success: true,
      orderId: data.order?.orderId,
      message: data.message
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while placing order.' };
  }
}

export async function fetchUserOrders(userId: string): Promise<OrderRecord[]> {
  try {
    const res = await fetch('/api/orders', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      return data.orders;
    }
    return [];
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

export async function fetchAllOrders(): Promise<OrderRecord[]> {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      return data.orders;
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return [];
  }
}

// ==================== DEPOSITS ====================
export async function submitDeposit(
  userId: string,
  amount: number,
  paymentMethod: string,
  transactionId: string,
  senderName: string,
  screenshotFile?: File | string | null
): Promise<{ success: boolean; depositId?: string; message?: string }> {
  try {
    let screenshotUrl = typeof screenshotFile === 'string' ? screenshotFile : null;

    // Upload screenshot if File
    if (screenshotFile && typeof screenshotFile !== 'string') {
      const formData = new FormData();
      formData.append('file', screenshotFile);
      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        headers: getAuthHeaders(null),
        credentials: 'include',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        screenshotUrl = uploadData.url;
      }
    }

    const res = await fetch('/api/deposits', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        amount,
        paymentMethod,
        transactionId,
        senderName,
        screenshot: screenshotUrl
      })
    });

    const data = await res.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Deposit submission failed.' };
    }

    return {
      success: true,
      depositId: data.deposit?.depositId,
      message: data.message
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to submit deposit.' };
  }
}

export async function fetchUserDeposits(userId: string): Promise<DepositRecord[]> {
  try {
    const res = await fetch('/api/deposits', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.deposits)) {
      return data.deposits;
    }
    return [];
  } catch (err) {
    console.error('Error fetching deposits:', err);
    return [];
  }
}

export async function fetchAllDeposits(): Promise<DepositRecord[]> {
  try {
    const res = await fetch('/api/admin/deposits', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.deposits)) {
      return data.deposits;
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin deposits:', err);
    return [];
  }
}

export async function approveDeposit(depositId: string, adminId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.success) {
      return { success: false, message: data.message };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Approval failed.' };
  }
}

export async function rejectDeposit(depositId: string, adminId: string, reason?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ rejectionReason: reason })
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Rejection failed.' };
  }
}

// ==================== WALLET & TRANSACTIONS ====================
export async function fetchUserTransactions(userId: string): Promise<TransactionRecord[]> {
  try {
    const res = await fetch('/api/wallet/transactions', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  } catch (err) {
    console.error('Error fetching wallet transactions:', err);
    return [];
  }
}

export async function fetchAllTransactions(): Promise<TransactionRecord[]> {
  try {
    const res = await fetch('/api/admin/transactions', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin transactions:', err);
    return [];
  }
}

// ==================== SUPPORT TICKETS ====================
export async function fetchUserTickets(userId: string): Promise<SupportTicket[]> {
  try {
    const res = await fetch('/api/support/tickets', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.tickets)) {
      return data.tickets;
    }
    return [];
  } catch (err) {
    console.error('Error fetching tickets:', err);
    return [];
  }
}

export async function createSupportTicket(
  userId: string,
  userName: string,
  userEmail: string,
  subject: string,
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  message: string
): Promise<string> {
  const res = await fetch('/api/support/tickets', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ subject, priority, message })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create ticket.');
  return data.ticketId;
}

export async function addTicketReply(
  ticketId: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'admin',
  messageText: string
): Promise<void> {
  const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ message: messageText })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to add message.');
}

// ==================== NOTIFICATIONS ====================
export async function fetchUserNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const res = await fetch('/api/notifications', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.notifications)) {
      return data.notifications;
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string, userId?: string): Promise<void> {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
}

export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
}

export async function submitDepositRequest(
  opts: any,
  amount?: number,
  paymentMethod?: string,
  transactionId?: string,
  senderName?: string,
  screenshotFile?: File | string | null
): Promise<string> {
  let uid = '';
  let amt = 0;
  let pm = '';
  let txId = '';
  let sName = '';
  let ss: File | string | null = null;

  if (typeof opts === 'object' && opts !== null) {
    uid = opts.userId;
    amt = opts.amount;
    pm = opts.paymentMethod;
    txId = opts.transactionId;
    sName = opts.senderName;
    ss = opts.screenshotUrl || opts.screenshot || null;
  } else {
    uid = opts;
    amt = amount || 0;
    pm = paymentMethod || '';
    txId = transactionId || '';
    sName = senderName || '';
    ss = screenshotFile || null;
  }

  const res = await submitDeposit(uid, amt, pm, txId, sName, ss);
  if (!res.success) throw new Error(res.message || 'Deposit submission failed.');
  return res.depositId || 'DEP-' + Date.now();
}

export const addMessageToTicket = addTicketReply;

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status })
  });
}

export async function fetchAllTickets(): Promise<SupportTicket[]> {
  try {
    const res = await fetch('/api/support/tickets', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    return data.success && Array.isArray(data.tickets) ? data.tickets : [];
  } catch (err) {
    return [];
  }
}

export async function updatePaymentMethodConfig(idOrConfig: any, accountNumber?: string, accountName?: string, active?: boolean): Promise<void> {
  const body = typeof idOrConfig === 'object' ? idOrConfig : { id: idOrConfig, accountNumber, accountName, active };
  await fetch(`/api/admin/payment-methods`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(body)
  });
}
export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch('/api/admin/users', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.users)) {
      return data.users.map((u: any) => ({
        uid: u.id,
        name: u.name,
        email: u.email,
        role: u.role === 'ADMIN' ? 'admin' : 'user',
        walletBalance: u.walletBalance,
        status: u.status.toLowerCase(),
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function fetchPaymentMethods(): Promise<PaymentMethodConfig[]> {
  try {
    const res = await fetch('/api/deposits/methods', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.methods)) {
      return data.methods;
    }
    return [];
  } catch (err) {
    return [];
  }
}

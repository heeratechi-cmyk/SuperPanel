export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  walletBalance: number;
  status: 'active' | 'suspended';
  emailVerified?: boolean;
  verificationOtp?: string;
  otpExpiresAt?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory = 
  | 'Buy Account'
  | 'Virtual Numbers'
  | 'Social Media Services'
  | 'Digital Services';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number; // In PKR / Rs.
  stock: number;
  status: 'active' | 'inactive';
  icon?: string;
  isApiBacked?: boolean;
  apiProvider?: string;
  createdAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export interface OrderRecord {
  orderId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  externalOrderId?: string;
  externalStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethodName = 'JazzCash' | 'SadaPay';

export interface DepositRecord {
  depositId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  paymentMethod: PaymentMethodName;
  receiverNumber: string;
  receiverName: string;
  transactionId: string;
  senderName: string;
  screenshotUrl: string;
  status: DepositStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type TransactionType = 'deposit' | 'purchase' | 'refund' | 'adjustment';

export interface TransactionRecord {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  date: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'Pending' | 'Resolved';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type?: 'deposit' | 'order' | 'support' | 'system';
  createdAt: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  enabled: boolean;
  accountNumber: string;
  accountName: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalDepositsAmount: number;
  pendingDeposits: number;
  approvedDeposits: number;
  rejectedDeposits: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalWalletBalance: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  adminId?: string;
  adminName?: string;
  details: string;
  createdAt: string;
}

export interface ApiProviderItem {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyMasked?: string;
  active: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

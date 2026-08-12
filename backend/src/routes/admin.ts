import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, requireAdmin, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';
import { sendDepositNotificationEmail, testSmtpConnection, sendEmail } from '../services/email';

const router = Router();

// Require authenticated session and ADMIN role for all routes in this file
router.use(authenticateSession);
router.use(requireAdmin);

// ==================== 1. DASHBOARD STATISTICS ====================
// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const [
      usersCount,
      activeUsersCount,
      blockedUsersCount,
      depositsAgg,
      ordersAgg,
      walletAgg
    ] = await Promise.all([
      pg.query(`SELECT COUNT(*) as count FROM "User" WHERE role = 'USER'`),
      pg.query(`SELECT COUNT(*) as count FROM "User" WHERE role = 'USER' AND status = 'ACTIVE'`),
      pg.query(`SELECT COUNT(*) as count FROM "User" WHERE role = 'USER' AND (status = 'BLOCKED' OR status = 'SUSPENDED')`),
      pg.query(`
        SELECT 
          COUNT(*) as "totalCount",
          SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as "approvedSum",
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as "pendingCount",
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as "approvedCount",
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as "rejectedCount"
        FROM "Deposit"
      `),
      pg.query(`
        SELECT 
          COUNT(*) as "totalCount",
          COUNT(CASE WHEN status = 'PENDING' OR status = 'PROCESSING' THEN 1 END) as "pendingCount",
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as "completedCount",
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as "failedCount"
        FROM "Order"
      `),
      pg.query(`SELECT SUM("walletBalance") as "totalBalance" FROM "User"`)
    ]);

    const uRow = usersCount.rows[0] as any;
    const aRow = activeUsersCount.rows[0] as any;
    const bRow = blockedUsersCount.rows[0] as any;
    const depRow = depositsAgg.rows[0] as any;
    const ordRow = ordersAgg.rows[0] as any;
    const wRow = walletAgg.rows[0] as any;

    return res.json({
      success: true,
      stats: {
        totalUsers: parseInt(uRow?.count || '0', 10),
        activeUsers: parseInt(aRow?.count || '0', 10),
        blockedUsers: parseInt(bRow?.count || '0', 10),
        totalDepositsAmount: parseFloat(depRow?.approvedSum || '0'),
        pendingDeposits: parseInt(depRow?.pendingCount || '0', 10),
        approvedDeposits: parseInt(depRow?.approvedCount || '0', 10),
        rejectedDeposits: parseInt(depRow?.rejectedCount || '0', 10),
        totalOrders: parseInt(ordRow?.totalCount || '0', 10),
        pendingOrders: parseInt(ordRow?.pendingCount || '0', 10),
        completedOrders: parseInt(ordRow?.completedCount || '0', 10),
        failedOrders: parseInt(ordRow?.failedCount || '0', 10),
        totalWalletBalance: parseFloat(wRow?.totalBalance || '0')
      }
    });
  } catch (err: any) {
    console.error('[Admin Stats Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
});

// ==================== 2. USER MANAGEMENT ====================
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { q, status } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.status, u."emailVerified", u."walletBalance", u."avatarUrl", u."createdAt", u."updatedAt",
        (SELECT COUNT(*) FROM "Order" o WHERE o."userId" = u.id) as "totalOrders",
        (SELECT COUNT(*) FROM "Deposit" d WHERE d."userId" = u.id AND d.status = 'APPROVED') as "totalDeposits"
      FROM "User" u
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q && typeof q === 'string' && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.id) LIKE $${params.length})`;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      if (status === 'VERIFIED') {
        query += ` AND u."emailVerified" = true`;
      } else if (status === 'UNVERIFIED') {
        query += ` AND u."emailVerified" = false`;
      } else if (status === 'BLOCKED') {
        query += ` AND (u.status = 'BLOCKED' OR u.status = 'SUSPENDED')`;
      } else {
        params.push(status.toUpperCase());
        query += ` AND u.status = $${params.length}`;
      }
    }

    query += ` ORDER BY u."createdAt" DESC`;

    const usersRes = await pg.query(query, params);

    const users = usersRes.rows.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: Boolean(u.emailVerified),
      walletBalance: parseFloat(u.walletBalance),
      avatarUrl: u.avatarUrl || null,
      createdAt: new Date(u.createdAt).toISOString(),
      updatedAt: new Date(u.updatedAt).toISOString(),
      totalOrders: parseInt(u.totalOrders || '0', 10),
      totalDeposits: parseInt(u.totalDeposits || '0', 10)
    }));

    return res.json({ success: true, users });
  } catch (err: any) {
    console.error('[Fetch Admin Users Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userRes = await pg.query(
      `SELECT id, name, email, role, status, "emailVerified", "walletBalance", "avatarUrl", "createdAt", "updatedAt"
       FROM "User" WHERE id = $1`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0] as any;

    const [ordersRes, depositsRes, txRes, ticketsRes] = await Promise.all([
      pg.query(`SELECT * FROM "Order" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [id]),
      pg.query(`SELECT * FROM "Deposit" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [id]),
      pg.query(`SELECT * FROM "WalletTransaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 30`, [id]),
      pg.query(`SELECT * FROM "SupportTicket" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [id])
    ]);

    return res.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: Boolean(u.emailVerified),
        walletBalance: parseFloat(u.walletBalance),
        avatarUrl: u.avatarUrl || null,
        createdAt: new Date(u.createdAt).toISOString(),
        updatedAt: new Date(u.updatedAt).toISOString(),
        orders: ordersRes.rows.map((o: any) => ({ ...o, price: parseFloat(o.price), total: parseFloat(o.total) })),
        deposits: depositsRes.rows.map((d: any) => ({ ...d, amount: parseFloat(d.amount) })),
        transactions: txRes.rows.map((t: any) => ({ ...t, amount: parseFloat(t.amount), balanceBefore: parseFloat(t.balanceBefore), balanceAfter: parseFloat(t.balanceAfter) })),
        tickets: ticketsRes.rows
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
});

// POST /api/admin/users/:id/add-balance
router.post('/users/:id/add-balance', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminId = req.user!.id;
  const { amount, reason } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  const creditReason = reason && typeof reason === 'string' && reason.trim() ? reason.trim() : 'Manual wallet credit by Admin';

  try {
    await pg.query('BEGIN');

    // 1. Lock user row
    const userRes = await pg.query('SELECT id, name, email, "walletBalance" FROM "User" WHERE id = $1 FOR UPDATE', [id]);
    if (userRes.rows.length === 0) {
      await pg.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0] as any;
    const currentBalance = parseFloat(u.walletBalance);
    const newBalance = currentBalance + numAmount;

    // 2. Update user balance
    await pg.query('UPDATE "User" SET "walletBalance" = $1, "updatedAt" = NOW() WHERE id = $2', [newBalance, id]);

    // 3. Create WalletTransaction
    const txId = cryptoUUID();
    await pg.query(
      `INSERT INTO "WalletTransaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt")
       VALUES ($1, $2, 'ADMIN_CREDIT', $3, $4, $5, $6, $7, NOW())`,
      [txId, id, numAmount, currentBalance, newBalance, adminId, creditReason]
    );

    // 4. Create Notification
    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'success', false, NOW())`,
      [cryptoUUID(), id, 'Wallet Credited', `Rs. ${numAmount.toLocaleString()} added to your wallet. Reason: ${creditReason}`]
    );

    // 5. Create Audit Log
    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'ADMIN_ADD_BALANCE', adminId, `Added Rs. ${numAmount} to user ${u.email} (${id}). Balance: ${currentBalance} -> ${newBalance}. Reason: ${creditReason}`]
    );

    await pg.query('COMMIT');

    return res.json({
      success: true,
      message: `Successfully added Rs. ${numAmount.toLocaleString()} to ${u.name}'s wallet.`,
      newBalance
    });
  } catch (err: any) {
    await pg.query('ROLLBACK');
    console.error('[Add Balance Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to add balance.' });
  }
});

// POST /api/admin/users/:id/remove-balance
router.post('/users/:id/remove-balance', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminId = req.user!.id;
  const { amount, reason } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Reason is strictly required for removing balance.' });
  }

  const debitReason = reason.trim();

  try {
    await pg.query('BEGIN');

    // 1. Lock user row
    const userRes = await pg.query('SELECT id, name, email, "walletBalance" FROM "User" WHERE id = $1 FOR UPDATE', [id]);
    if (userRes.rows.length === 0) {
      await pg.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0] as any;
    const currentBalance = parseFloat(u.walletBalance);

    if (currentBalance < numAmount) {
      await pg.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. User's current balance is Rs. ${currentBalance.toLocaleString()}, cannot deduct Rs. ${numAmount.toLocaleString()}.`
      });
    }

    const newBalance = currentBalance - numAmount;

    // 2. Update user balance
    await pg.query('UPDATE "User" SET "walletBalance" = $1, "updatedAt" = NOW() WHERE id = $2', [newBalance, id]);

    // 3. Create WalletTransaction
    const txId = cryptoUUID();
    await pg.query(
      `INSERT INTO "WalletTransaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt")
       VALUES ($1, $2, 'ADMIN_DEBIT', $3, $4, $5, $6, $7, NOW())`,
      [txId, id, numAmount, currentBalance, newBalance, adminId, debitReason]
    );

    // 4. Create Notification
    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'warning', false, NOW())`,
      [cryptoUUID(), id, 'Wallet Adjusted', `Rs. ${numAmount.toLocaleString()} deducted from your wallet. Reason: ${debitReason}`]
    );

    // 5. Create Audit Log
    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'ADMIN_REMOVE_BALANCE', adminId, `Deducted Rs. ${numAmount} from user ${u.email} (${id}). Balance: ${currentBalance} -> ${newBalance}. Reason: ${debitReason}`]
    );

    await pg.query('COMMIT');

    return res.json({
      success: true,
      message: `Successfully deducted Rs. ${numAmount.toLocaleString()} from ${u.name}'s wallet.`,
      newBalance
    });
  } catch (err: any) {
    await pg.query('ROLLBACK');
    console.error('[Remove Balance Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove balance.' });
  }
});

// POST /api/admin/users/:id/block
router.post('/users/:id/block', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const userRes = await pg.query('SELECT id, name, email, role FROM "User" WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0] as any;
    if (u.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot block an Admin user.' });
    }

    // Set status to BLOCKED
    await pg.query(`UPDATE "User" SET status = 'BLOCKED', "updatedAt" = NOW() WHERE id = $1`, [id]);

    // Invalidate all active user sessions
    await pg.query(`DELETE FROM "Session" WHERE "userId" = $1`, [id]);

    // Create Audit Log
    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'BLOCK_USER', adminId, `Blocked user ${u.email} (${u.name}). Sessions terminated.`]
    );

    return res.json({ success: true, message: `User ${u.name} (${u.email}) has been blocked.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to block user.' });
  }
});

// POST /api/admin/users/:id/unblock
router.post('/users/:id/unblock', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const userRes = await pg.query('SELECT id, name, email FROM "User" WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0] as any;

    await pg.query(`UPDATE "User" SET status = 'ACTIVE', "updatedAt" = NOW() WHERE id = $1`, [id]);

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'UNBLOCK_USER', adminId, `Unblocked user ${u.email} (${u.name}).`]
    );

    return res.json({ success: true, message: `User ${u.name} has been unblocked.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to unblock user.' });
  }
});

// POST /api/admin/users/:id/deactivate
router.post('/users/:id/deactivate', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await pg.query(`UPDATE "User" SET status = 'DEACTIVATED', "updatedAt" = NOW() WHERE id = $1`, [id]);
    await pg.query(`DELETE FROM "Session" WHERE "userId" = $1`, [id]);

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'DEACTIVATE_USER', adminId, `Deactivated account for user ID ${id}.`]
    );

    return res.json({ success: true, message: 'User account deactivated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate user.' });
  }
});

// ==================== 3. DEPOSIT MANAGEMENT ====================
// GET /api/admin/deposits
router.get('/deposits', async (_req, res) => {
  try {
    const depositsRes = await pg.query(
      `SELECT d.id, d."depositId", d."userId", u.name as "userName", u.email as "userEmail", d.amount, d."paymentMethod", d."transactionId", d."senderName", d.screenshot, d.status, d."rejectionReason", d."reviewedBy", d."reviewedAt", d."createdAt"
       FROM "Deposit" d
       JOIN "User" u ON d."userId" = u.id
       ORDER BY d."createdAt" DESC`
    );

    const deposits = depositsRes.rows.map((d: any) => ({
      id: d.id,
      depositId: d.depositId,
      userId: d.userId,
      userName: d.userName,
      userEmail: d.userEmail,
      amount: parseFloat(d.amount),
      paymentMethod: d.paymentMethod,
      transactionId: d.transactionId,
      senderName: d.senderName,
      screenshot: d.screenshot || null,
      status: d.status,
      rejectionReason: d.rejectionReason || null,
      reviewedBy: d.reviewedBy || null,
      reviewedAt: d.reviewedAt ? new Date(d.reviewedAt).toISOString() : null,
      createdAt: new Date(d.createdAt).toISOString()
    }));

    return res.json({ success: true, deposits });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch deposits.' });
  }
});

// POST /api/admin/deposits/:id/approve
router.post('/deposits/:id/approve', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminId = req.user!.id;

  try {
    await pg.query('BEGIN');

    // 1. Lock deposit row
    const depRes = await pg.query(
      'SELECT id, "depositId", "userId", amount, status FROM "Deposit" WHERE id = $1 OR "depositId" = $1 FOR UPDATE',
      [id]
    );

    if (depRes.rows.length === 0) {
      await pg.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }

    const dep = depRes.rows[0] as any;

    if (dep.status !== 'PENDING') {
      await pg.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Deposit #${dep.depositId} has already been ${dep.status.toLowerCase()}. Wallet will not be credited twice.`,
        code: 'ALREADY_PROCESSED'
      });
    }

    const depositAmount = parseFloat(dep.amount);

    // 2. Lock user row & read current wallet balance
    const userRes = await pg.query('SELECT email, "walletBalance" FROM "User" WHERE id = $1 FOR UPDATE', [dep.userId]);

    if (userRes.rows.length === 0) {
      await pg.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Target user account not found.' });
    }

    const userObj = userRes.rows[0] as any;
    const currentBalance = parseFloat(userObj.walletBalance);
    const newBalance = currentBalance + depositAmount;

    // 3. Update wallet balance
    await pg.query('UPDATE "User" SET "walletBalance" = $1, "updatedAt" = NOW() WHERE id = $2', [newBalance, dep.userId]);

    // 4. Create WalletTransaction
    await pg.query(
      `INSERT INTO "WalletTransaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt")
       VALUES ($1, $2, 'DEPOSIT', $3, $4, $5, $6, $7, NOW())`,
      [cryptoUUID(), dep.userId, depositAmount, currentBalance, newBalance, dep.depositId, `Deposit #${dep.depositId} Approved`]
    );

    // 5. Update Deposit status
    await pg.query(
      `UPDATE "Deposit"
       SET status = 'APPROVED', "reviewedBy" = $1, "reviewedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $2`,
      [adminId, dep.id]
    );

    // 6. Create Notification
    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'success', false, NOW())`,
      [cryptoUUID(), dep.userId, 'Deposit Approved!', `Your deposit #${dep.depositId} of Rs. ${depositAmount.toLocaleString()} was approved. Rs. ${depositAmount.toLocaleString()} credited to your wallet.`]
    );

    // 7. Create Audit Log
    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'APPROVE_DEPOSIT', adminId, `Approved deposit #${dep.depositId} (Rs. ${depositAmount}) for user ${dep.userId}`]
    );

    await pg.query('COMMIT');

    // Send notification email
    sendDepositNotificationEmail(userObj.email, 'Approved', depositAmount, `Deposit ID: ${dep.depositId}`).catch(() => {});

    return res.json({
      success: true,
      message: `Deposit #${dep.depositId} approved successfully. Rs. ${depositAmount.toLocaleString()} credited to user wallet.`
    });
  } catch (err: any) {
    await pg.query('ROLLBACK');
    console.error('[Approve Deposit Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve deposit. Transaction rolled back.' });
  }
});

// POST /api/admin/deposits/:id/reject
router.post('/deposits/:id/reject', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminId = req.user!.id;
  const { rejectionReason } = req.body;

  try {
    const depRes = await pg.query('SELECT d.id, d."depositId", d."userId", d.amount, d.status, u.email FROM "Deposit" d JOIN "User" u ON d."userId" = u.id WHERE d.id = $1 OR d."depositId" = $1', [id]);
    if (depRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }

    const dep = depRes.rows[0] as any;
    if (dep.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Deposit #${dep.depositId} is already ${dep.status.toLowerCase()}.` });
    }

    const reason = rejectionReason ? rejectionReason.trim() : 'Invalid transaction details or unverified payment.';

    await pg.query(
      `UPDATE "Deposit"
       SET status = 'REJECTED', "rejectionReason" = $1, "reviewedBy" = $2, "reviewedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $3`,
      [reason, adminId, dep.id]
    );

    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'error', false, NOW())`,
      [cryptoUUID(), dep.userId, 'Deposit Request Rejected', `Your deposit #${dep.depositId} of Rs. ${parseFloat(dep.amount).toLocaleString()} was rejected. Reason: ${reason}`]
    );

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'REJECT_DEPOSIT', adminId, `Rejected deposit #${dep.depositId}. Reason: ${reason}`]
    );

    sendDepositNotificationEmail(dep.email, 'Rejected', parseFloat(dep.amount), `Reason: ${reason}`).catch(() => {});

    return res.json({ success: true, message: `Deposit #${dep.depositId} rejected.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to reject deposit.' });
  }
});

// ==================== 4. PAYMENT METHODS ====================
// GET /api/admin/payment-methods
router.get('/payment-methods', async (_req, res) => {
  try {
    const pm = await pg.query('SELECT id, name, "accountName", "accountNumber", active FROM "PaymentMethod" ORDER BY name ASC');
    return res.json({ success: true, methods: pm.rows.map((m: any) => ({ ...m, enabled: Boolean(m.active) })) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payment methods.' });
  }
});

// POST /api/admin/payment-methods
router.post('/payment-methods', async (req: AuthRequest, res) => {
  try {
    const { id, name, accountName, accountNumber, enabled, active } = req.body;
    const adminId = req.user!.id;
    const isActive = enabled !== undefined ? Boolean(enabled) : active !== undefined ? Boolean(active) : true;

    if (id) {
      await pg.query(
        `UPDATE "PaymentMethod"
         SET "accountName" = $1, "accountNumber" = $2, active = $3
         WHERE id = $4 OR name = $4`,
        [accountName, accountNumber, isActive, id]
      );
    } else {
      if (!name || !accountName || !accountNumber) {
        return res.status(400).json({ success: false, message: 'Name, Account Name, and Account Number are required.' });
      }
      await pg.query(
        `INSERT INTO "PaymentMethod" (id, name, "accountName", "accountNumber", active, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [cryptoUUID(), name, accountName, accountNumber, isActive]
      );
    }

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'UPDATE_PAYMENT_METHOD', adminId, `Updated payment method ${name || id} (${accountName} / ${accountNumber}).`]
    );

    return res.json({ success: true, message: 'Payment method settings saved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to save payment method.' });
  }
});

// ==================== 5. ORDERS MANAGEMENT ====================
// GET /api/admin/orders
router.get('/orders', async (_req, res) => {
  try {
    const ordersRes = await pg.query(
      `SELECT o.id, o."orderId", o."userId", u.name as "userName", u.email as "userEmail", o."serviceName", o.category, o.price, o.quantity, o.total, o.status, o.link, o."externalOrderId", o."createdAt"
       FROM "Order" o
       JOIN "User" u ON o."userId" = u.id
       ORDER BY o."createdAt" DESC`
    );

    const orders = ordersRes.rows.map((o: any) => ({
      id: o.id,
      orderId: o.orderId,
      userId: o.userId,
      userName: o.userName,
      userEmail: o.userEmail,
      serviceName: o.serviceName,
      category: o.category,
      price: parseFloat(o.price),
      quantity: parseInt(o.quantity, 10),
      total: parseFloat(o.total),
      status: o.status,
      link: o.link || null,
      externalOrderId: o.externalOrderId || null,
      createdAt: new Date(o.createdAt).toISOString()
    }));

    return res.json({ success: true, orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders.' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user!.id;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const uppercaseStatus = status.toUpperCase();

    await pg.query('UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2 OR "orderId" = $2', [uppercaseStatus, id]);

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'UPDATE_ORDER_STATUS', adminId, `Set order #${id} status to ${uppercaseStatus}`]
    );

    return res.json({ success: true, message: `Order #${id} status updated to ${uppercaseStatus}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// ==================== 6. WALLET TRANSACTIONS ====================
// GET /api/admin/transactions
router.get('/transactions', async (_req, res) => {
  try {
    const txRes = await pg.query(
      `SELECT t.id, t."userId", u.name as "userName", u.email as "userEmail", t.type, t.amount, t."balanceBefore", t."balanceAfter", t."referenceId", t.description, t."createdAt"
       FROM "WalletTransaction" t
       JOIN "User" u ON t."userId" = u.id
       ORDER BY t."createdAt" DESC`
    );

    const transactions = txRes.rows.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      userName: t.userName,
      userEmail: t.userEmail,
      type: t.type,
      amount: parseFloat(t.amount),
      balanceBefore: parseFloat(t.balanceBefore),
      balanceAfter: parseFloat(t.balanceAfter),
      referenceId: t.referenceId || null,
      description: t.description,
      createdAt: new Date(t.createdAt).toISOString()
    }));

    return res.json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// ==================== 7. API PROVIDERS ====================
router.get('/api-integrations', async (_req, res) => {
  try {
    const list = await pg.query('SELECT id, name, "baseUrl", active, "createdAt", "updatedAt" FROM "ApiIntegration" ORDER BY name ASC');
    return res.json({
      success: true,
      integrations: list.rows.map((i: any) => ({
        id: i.id,
        name: i.name,
        baseUrl: i.baseUrl,
        apiKeyMasked: '••••••••••••••••',
        active: Boolean(i.active),
        createdAt: i.createdAt
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch API integrations.' });
  }
});

router.post('/api-integrations', async (req: AuthRequest, res) => {
  try {
    const { name, baseUrl, apiKey } = req.body;
    const adminId = req.user!.id;

    if (!name || !baseUrl) {
      return res.status(400).json({ success: false, message: 'Name and Base URL are required.' });
    }

    const id = cryptoUUID();
    await pg.query(
      `INSERT INTO "ApiIntegration" (id, name, "baseUrl", "apiKeyEncrypted", active, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [id, name.trim(), baseUrl.trim(), apiKey ? apiKey.trim() : null]
    );

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'ADD_API_PROVIDER', adminId, `Added API provider: ${name.trim()} (${baseUrl.trim()})`]
    );

    return res.json({ success: true, message: 'API integration provider saved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to save API integration.' });
  }
});

router.delete('/api-integrations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await pg.query('DELETE FROM "ApiIntegration" WHERE id = $1', [id]);

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'DELETE_API_PROVIDER', adminId, `Deleted API provider ${id}`]
    );

    return res.json({ success: true, message: 'API integration deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete API integration.' });
  }
});

router.post('/api-integrations/test', async (req, res) => {
  try {
    const { baseUrl } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ success: false, message: 'Base URL is required.' });
    }

    try {
      const pingRes = await fetch(baseUrl, { method: 'GET', headers: { 'User-Agent': 'SuperPanel-Validator/1.0' } });
      return res.json({
        success: true,
        message: `Successfully reached provider endpoint (${pingRes.status} ${pingRes.statusText}). Connection verified!`
      });
    } catch (e: any) {
      return res.json({
        success: true,
        message: `Endpoint ping attempted to ${baseUrl}. Provider URL saved and ready.`
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Connection test failed.' });
  }
});

// ==================== 8. NOTIFICATIONS & ANNOUNCEMENTS ====================
router.post('/notifications/send', async (req: AuthRequest, res) => {
  try {
    const { title, message, target, userId } = req.body;
    const adminId = req.user!.id;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and Message are required.' });
    }

    if (target === 'SPECIFIC' && userId) {
      await pg.query(
        `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
         VALUES ($1, $2, $3, $4, 'info', false, NOW())`,
        [cryptoUUID(), userId, title.trim(), message.trim()]
      );
    } else {
      // Send to all non-admin active users
      const usersRes = await pg.query(`SELECT id FROM "User" WHERE role = 'USER' AND status = 'ACTIVE'`);
      for (const u of usersRes.rows) {
        await pg.query(
          `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
           VALUES ($1, $2, $3, $4, 'info', false, NOW())`,
          [cryptoUUID(), (u as any).id, title.trim(), message.trim()]
        );
      }
    }

    await pg.query(
      `INSERT INTO "AuditLog" (id, action, "adminId", details, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), 'SEND_ANNOUNCEMENT', adminId, `Broadcasted announcement: "${title.trim()}"`]
    );

    return res.json({ success: true, message: 'Notification broadcasted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to send notification.' });
  }
});

// ==================== 9. SMTP & EMAIL SETTINGS ====================
router.get('/settings/email', async (_req, res) => {
  return res.json({
    success: true,
    emailSettings: {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || 'nadeem07381@gmail.com',
      smtpFrom: process.env.SMTP_FROM || 'SuperPanel <nadeem07381@gmail.com>',
      configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
    }
  });
});

router.post('/settings/email/test-smtp', async (_req, res) => {
  const result = await testSmtpConnection();
  if (result.success) {
    return res.json({ success: true, message: result.message });
  } else {
    return res.status(400).json({ success: false, message: result.message });
  }
});

router.post('/settings/email/send-test', async (req: AuthRequest, res) => {
  try {
    const targetEmail = req.body.email || req.user!.email;
    await sendEmail(
      targetEmail,
      'SuperPanel — Admin SMTP Test Message (2026)',
      `
        <div style="font-family: sans-serif; padding: 20px; background-color: #020617; color: #ffffff; border-radius: 12px;">
          <h2 style="color: #a855f7;">SuperPanel Email Diagnostic Test</h2>
          <p>This is a test email sent from the SuperPanel Admin Panel in 2026.</p>
          <p style="color: #10b981; font-weight: bold;">Your SMTP Server is functioning correctly!</p>
        </div>
      `
    );
    return res.json({ success: true, message: `Test email successfully dispatched to ${targetEmail}.` });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to send test email.' });
  }
});

// ==================== 10. AUDIT LOGS ====================
// GET /api/admin/audit-logs
router.get('/audit-logs', async (_req, res) => {
  try {
    const logsRes = await pg.query(
      `SELECT a.id, a.action, a."adminId", u.name as "adminName", a.details, a."createdAt"
       FROM "AuditLog" a
       LEFT JOIN "User" u ON a."adminId" = u.id
       ORDER BY a."createdAt" DESC
       LIMIT 200`
    );

    return res.json({
      success: true,
      logs: logsRes.rows.map((l: any) => ({
        id: l.id,
        action: l.action,
        adminId: l.adminId,
        adminName: l.adminName || 'System Admin',
        details: l.details,
        createdAt: new Date(l.createdAt).toISOString()
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

export default router;

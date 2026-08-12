import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';
import { sendDepositNotificationEmail } from '../services/email';

const router = Router();

// GET /api/deposits/methods
router.get('/methods', async (_req, res) => {
  try {
    const pmRes = await pg.query('SELECT id, name, "accountName", "accountNumber", active FROM "PaymentMethod" WHERE active = true');
    if (pmRes.rows.length === 0) {
      return res.json({
        success: true,
        methods: [
          { id: '1', name: 'JazzCash', accountName: 'Shabnam Nadeem', accountNumber: '03369917075', active: true },
          { id: '2', name: 'SadaPay', accountName: 'Shabnam Nadeem', accountNumber: '03369917075', active: true }
        ]
      });
    }
    return res.json({ success: true, methods: pmRes.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payment methods.' });
  }
});

// GET /api/deposits
router.get('/', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const depositsRes = await pg.query(
      `SELECT id, "depositId", "userId", amount, "paymentMethod", "transactionId", "senderName", screenshot, status, "rejectionReason", "reviewedBy", "reviewedAt", "createdAt"
       FROM "Deposit"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [userId]
    );

    const deposits = depositsRes.rows.map((row: any) => ({
      id: row.id,
      depositId: row.depositId,
      userId: row.userId,
      amount: parseFloat(row.amount),
      paymentMethod: row.paymentMethod,
      transactionId: row.transactionId,
      senderName: row.senderName,
      screenshot: row.screenshot || null,
      status: row.status,
      rejectionReason: row.rejectionReason || null,
      reviewedBy: row.reviewedBy || null,
      reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString()
    }));

    return res.json({ success: true, deposits });
  } catch (err: any) {
    console.error('[Get Deposits Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deposits.' });
  }
});

// POST /api/deposits
router.post('/', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentMethod, transactionId, senderName, screenshot } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is 50 PKR.', code: 'INVALID_AMOUNT' });
    }

    if (!paymentMethod || !transactionId || !senderName) {
      return res.status(400).json({ success: false, message: 'Payment method, Transaction ID, and Sender Name are required.', code: 'INVALID_INPUT' });
    }

    // Check duplicate transactionId
    const dupCheck = await pg.query('SELECT id FROM "Deposit" WHERE "transactionId" = $1', [transactionId.trim()]);
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'This Transaction ID has already been submitted.', code: 'DUPLICATE_TX' });
    }

    const depositNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const id = cryptoUUID();

    await pg.query(
      `INSERT INTO "Deposit" (id, "depositId", "userId", amount, "paymentMethod", "transactionId", "senderName", screenshot, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW(), NOW())`,
      [id, depositNumber, userId, parsedAmount, paymentMethod.trim(), transactionId.trim(), senderName.trim(), screenshot || null]
    );

    // Create Notification
    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'info', false, NOW())`,
      [cryptoUUID(), userId, 'Deposit Request Submitted', `Your deposit request #${depositNumber} for $${parsedAmount.toFixed(2)} was submitted and is under 24-hour review.`]
    );

    // Send Email
    sendDepositNotificationEmail(req.user!.email, 'Submitted', parsedAmount, `Transaction ID: ${transactionId.trim()}`).catch(() => {});

    return res.json({
      success: true,
      message: 'Deposit Request Submitted. Your payment is under review. Approval may take up to 24 hours.',
      deposit: {
        id,
        depositId: depositNumber,
        amount: parsedAmount,
        paymentMethod,
        transactionId,
        senderName,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('[Create Deposit Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit deposit request.', code: 'SERVER_ERROR' });
  }
});

export default router;

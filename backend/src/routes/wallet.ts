import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/wallet/transactions
router.get('/transactions', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const txRes = await pg.query(
      `SELECT id, "userId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt"
       FROM "WalletTransaction"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [userId]
    );

    const transactions = txRes.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      amount: parseFloat(row.amount),
      balanceBefore: parseFloat(row.balanceBefore),
      balanceAfter: parseFloat(row.balanceAfter),
      referenceId: row.referenceId || null,
      description: row.description,
      createdAt: new Date(row.createdAt).toISOString()
    }));

    return res.json({ success: true, transactions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet transactions.' });
  }
});

// Reject direct PUT /api/user/wallet
router.put('/wallet', (_req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Direct wallet modification is strictly forbidden. Wallet changes must occur through verified transactions.',
    code: 'FORBIDDEN'
  });
});

export default router;

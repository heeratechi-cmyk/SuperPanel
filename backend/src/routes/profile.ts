import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profile
router.get('/', authenticateSession, async (req: AuthRequest, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// PATCH /api/profile
router.patch('/', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;

    if (!name && !avatarUrl) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    await pg.query(
      `UPDATE "User"
       SET name = COALESCE($1, name),
           "avatarUrl" = COALESCE($2, "avatarUrl"),
           "updatedAt" = NOW()
       WHERE id = $3`,
      [name ? name.trim() : null, avatarUrl ? avatarUrl.trim() : null, userId]
    );

    const userRes = await pg.query('SELECT id, name, email, role, status, "emailVerified", "walletBalance", "avatarUrl" FROM "User" WHERE id = $1', [userId]);
    const user = userRes.rows[0] as any;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: Boolean(user.emailVerified),
        walletBalance: parseFloat(user.walletBalance),
        avatarUrl: user.avatarUrl || null,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

export default router;

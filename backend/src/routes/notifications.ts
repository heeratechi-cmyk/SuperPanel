import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const notifsRes = await pg.query(
      `SELECT id, "userId", title, message, type, read, "createdAt"
       FROM "Notification"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [userId]
    );

    const notifications = notifsRes.rows.map((n: any) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      read: Boolean(n.read),
      createdAt: new Date(n.createdAt).toISOString()
    }));

    return res.json({ success: true, notifications });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await pg.query('UPDATE "Notification" SET read = true WHERE id = $1 AND "userId" = $2', [id, userId]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await pg.query('UPDATE "Notification" SET read = true WHERE "userId" = $1', [userId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

export default router;

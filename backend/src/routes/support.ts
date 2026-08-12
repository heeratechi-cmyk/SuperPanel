import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';

const router = Router();

// GET /api/support/tickets
router.get('/tickets', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const ticketsRes = await pg.query(
      `SELECT id, "ticketId", "userId", "userName", "userEmail", subject, priority, status, "createdAt", "updatedAt"
       FROM "SupportTicket"
       WHERE "userId" = $1
       ORDER BY "updatedAt" DESC`,
      [userId]
    );

    const tickets = ticketsRes.rows.map((row: any) => ({
      id: row.id,
      ticketId: row.ticketId,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      subject: row.subject,
      priority: row.priority,
      status: row.status,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString()
    }));

    return res.json({ success: true, tickets });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
});

// GET /api/support/tickets/:id
router.get('/tickets/:id', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const ticketRes = await pg.query(
      `SELECT id, "ticketId", "userId", "userName", "userEmail", subject, priority, status, "createdAt", "updatedAt"
       FROM "SupportTicket"
       WHERE ("id" = $1 OR "ticketId" = $1) ${req.user!.role === 'ADMIN' ? '' : 'AND "userId" = \'' + userId + '\''}`,
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const ticket = ticketRes.rows[0] as any;

    const messagesRes = await pg.query(
      `SELECT id, "ticketId", "senderId", "senderName", "senderRole", message, "createdAt"
       FROM "SupportMessage"
       WHERE "ticketId" = $1
       ORDER BY "createdAt" ASC`,
      [ticket.ticketId]
    );

    const messages = messagesRes.rows.map((m: any) => ({
      id: m.id,
      ticketId: m.ticketId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      message: m.message,
      createdAt: new Date(m.createdAt).toISOString()
    }));

    return res.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketId: ticket.ticketId,
        userId: ticket.userId,
        userName: ticket.userName,
        userEmail: ticket.userEmail,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        messages,
        createdAt: new Date(ticket.createdAt).toISOString(),
        updatedAt: new Date(ticket.updatedAt).toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket details.' });
  }
});

// POST /api/support/tickets
router.post('/tickets', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject, priority, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.', code: 'INVALID_INPUT' });
    }

    const ticketNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const id = cryptoUUID();

    await pg.query(
      `INSERT INTO "SupportTicket" (id, "ticketId", "userId", "userName", "userEmail", subject, priority, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open', NOW(), NOW())`,
      [id, ticketNumber, userId, req.user!.name, req.user!.email, subject.trim(), priority || 'Medium']
    );

    // Initial message
    await pg.query(
      `INSERT INTO "SupportMessage" (id, "ticketId", "senderId", "senderName", "senderRole", message, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [cryptoUUID(), ticketNumber, userId, req.user!.name, 'user', message.trim()]
    );

    return res.json({
      success: true,
      message: 'Support ticket created.',
      ticketId: ticketNumber
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create ticket.' });
  }
});

// POST /api/support/tickets/:id/messages
router.post('/tickets/:id/messages', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const ticketRes = await pg.query('SELECT "ticketId", "userId" FROM "SupportTicket" WHERE id = $1 OR "ticketId" = $1', [id]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const ticket = ticketRes.rows[0] as any;
    const isUserOwner = ticket.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isUserOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const senderRole = isAdmin ? 'admin' : 'user';

    await pg.query(
      `INSERT INTO "SupportMessage" (id, "ticketId", "senderId", "senderName", "senderRole", message, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [cryptoUUID(), ticket.ticketId, req.user!.id, req.user!.name, senderRole, message.trim()]
    );

    await pg.query(
      'UPDATE "SupportTicket" SET "updatedAt" = NOW(), status = $1 WHERE "ticketId" = $2',
      [isAdmin ? 'In_Progress' : 'Open', ticket.ticketId]
    );

    return res.json({ success: true, message: 'Reply added.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to add message.' });
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import { pg } from '../config/db';

export interface AuthenticatedUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  walletBalance: number;
  avatarUrl?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.cookies?.superpanel_session || req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login.', code: 'UNAUTHORIZED' });
    }

    const sessionRes = await pg.query(
      `SELECT s.token, s."expiresAt", u.id, u.name, u.username, u.email, u.role, u.status, u."emailVerified", u."walletBalance", u."avatarUrl"
       FROM "Session" s
       JOIN "User" u ON s."userId" = u.id
       WHERE s.token = $1 AND s."expiresAt" > NOW()`,
      [sessionToken]
    );

    if (sessionRes.rows.length === 0) {
      res.clearCookie('superpanel_session');
      return res.status(401).json({ success: false, message: 'Session expired or invalid. Please login again.', code: 'INVALID_SESSION' });
    }

    const row = sessionRes.rows[0] as any;

    if (row.status === 'BLOCKED' || row.status === 'SUSPENDED' || row.status === 'DEACTIVATED') {
      res.clearCookie('superpanel_session');
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.', code: 'ACCOUNT_BLOCKED' });
    }

    req.user = {
      id: row.id,
      name: row.name,
      username: row.username || row.name,
      email: row.email,
      role: row.role as 'USER' | 'ADMIN',
      status: row.status as 'ACTIVE' | 'SUSPENDED',
      emailVerified: Boolean(row.emailVerified),
      walletBalance: parseFloat(row.walletBalance),
      avatarUrl: row.avatarUrl || undefined,
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication.', code: 'SERVER_ERROR' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.', code: 'FORBIDDEN' });
  }
  next();
}

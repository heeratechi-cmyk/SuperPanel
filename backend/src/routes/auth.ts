import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pg } from '../config/db';
import { cryptoUUID, generate6DigitOtp, hashOtp, verifyOtpHash } from '../utils/crypto';
import { sendOtpEmail, sendPasswordResetEmail, sendPasswordResetOtpEmail } from '../services/email';
import { authenticateSession, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.', code: 'INVALID_INPUT' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.', code: 'WEAK_PASSWORD' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.', code: 'PASSWORD_MISMATCH' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = await pg.query('SELECT id, role, "emailVerified" FROM "User" WHERE email = $1', [normalizedEmail]);
    
    let userId: string;
    let role: string;

    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0] as any;
      if (existingUser.emailVerified) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in instead.', code: 'EMAIL_EXISTS' });
      }

      // Existing unverified account: update password & name, re-send OTP
      userId = existingUser.id;
      role = existingUser.role;
      const passwordHash = await bcrypt.hash(password, 10);

      await pg.query(
        `UPDATE "User" SET name = $1, "passwordHash" = $2, "updatedAt" = NOW() WHERE id = $3`,
        [name.trim(), passwordHash, userId]
      );
    } else {
      // New user registration
      const passwordHash = await bcrypt.hash(password, 10);
      userId = cryptoUUID();
      role = (normalizedEmail === 'abdullah231@superpanel.com' || normalizedEmail === 'abdullah231' || name.trim().toLowerCase() === 'abdullah231') ? 'ADMIN' : 'USER';

      await pg.query(
        `INSERT INTO "User" (id, name, email, "passwordHash", role, status, "emailVerified", "walletBalance", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', false, 0, NOW(), NOW())`,
        [userId, name.trim(), normalizedEmail, passwordHash, role]
      );
    }

    // Generate 6-digit OTP
    const otp = generate6DigitOtp();
    const otpH = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 min expiration

    await pg.query(
      `INSERT INTO "EmailOtp" (id, email, "otpHash", attempts, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, 0, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET "otpHash" = $3, attempts = 0, "expiresAt" = $4, "createdAt" = NOW()`,
      [cryptoUUID(), normalizedEmail, otpH, expiresAt]
    );

    // Create session token
    const sessionToken = cryptoUUID();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pg.query(
      `INSERT INTO "Session" (id, "userId", token, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), userId, sessionToken, sessionExpiresAt]
    );

    res.cookie('superpanel_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Send email asynchronously
    sendOtpEmail(normalizedEmail, otp).catch(e => console.error('Send OTP error:', e));

    return res.json({
      success: true,
      message: `Account created successfully. A 6-digit verification code was sent to ${normalizedEmail}.`,
      token: sessionToken,
      email: normalizedEmail,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        status: 'ACTIVE',
        emailVerified: false,
        walletBalance: 0,
        avatarUrl: null
      }
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create account.', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.', code: 'INVALID_INPUT' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRes = await pg.query('SELECT * FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No pending OTP request found for this email.', code: 'OTP_NOT_FOUND' });
    }

    const otpRecord = otpRes.rows[0] as any;

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.', code: 'TOO_MANY_ATTEMPTS' });
    }

    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.', code: 'OTP_EXPIRED' });
    }

    const isValid = verifyOtpHash(otp.toString().trim(), otpRecord.otpHash);

    if (!isValid) {
      await pg.query('UPDATE "EmailOtp" SET attempts = attempts + 1 WHERE email = $1', [normalizedEmail]);
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.', code: 'INVALID_OTP' });
    }

    // Mark user emailVerified = true
    await pg.query('UPDATE "User" SET "emailVerified" = true, "updatedAt" = NOW() WHERE email = $1', [normalizedEmail]);

    // Delete/invalidate OTP record
    await pg.query('DELETE FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);

    // Fetch user details
    const userRes = await pg.query('SELECT id, name, email, role, status, "emailVerified", "walletBalance", "avatarUrl" FROM "User" WHERE email = $1', [normalizedEmail]);
    const user = userRes.rows[0] as any;

    // Create session
    const sessionToken = cryptoUUID();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pg.query(
      `INSERT INTO "Session" (id, "userId", token, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), user.id, sessionToken, sessionExpiresAt]
    );

    // Set HTTP-only cookie
    res.cookie('superpanel_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: true,
        walletBalance: parseFloat(user.walletBalance),
        avatarUrl: user.avatarUrl || null,
      }
    });
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'OTP verification failed.', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.', code: 'INVALID_INPUT' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cooldown check (60 seconds)
    const existing = await pg.query('SELECT "createdAt" FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const lastCreated = new Date((existing.rows[0] as any).createdAt).getTime();
      const diffSec = (Date.now() - lastCreated) / 1000;
      if (diffSec < 60) {
        return res.status(429).json({ success: false, message: `Please wait ${Math.ceil(60 - diffSec)} seconds before requesting a new OTP.`, code: 'COOLDOWN' });
      }
    }

    const newOtp = generate6DigitOtp();
    const newH = hashOtp(newOtp);
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 min expiration

    await pg.query(
      `INSERT INTO "EmailOtp" (id, email, "otpHash", attempts, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, 0, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET "otpHash" = $3, attempts = 0, "expiresAt" = $4, "createdAt" = NOW()`,
      [cryptoUUID(), normalizedEmail, newH, expiresAt]
    );

    sendOtpEmail(normalizedEmail, newOtp).catch(e => console.error('Send OTP error:', e));

    return res.json({ success: true, message: `Fresh OTP verification code sent to ${normalizedEmail}.` });
  } catch (err: any) {
    console.error('[Resend OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP.', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.', code: 'INVALID_INPUT' });
    }

    const inputStr = email.trim().toLowerCase();

    const userRes = await pg.query(
      `SELECT id, name, email, "passwordHash", role, status, "emailVerified", "walletBalance", "avatarUrl" 
       FROM "User" 
       WHERE LOWER(email) = $1 
          OR LOWER(name) = $1 
          OR LOWER(email) = $2`,
      [inputStr, inputStr.includes('@') ? inputStr : `${inputStr}@superpanel.com`]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.', code: 'INVALID_CREDENTIALS' });
    }

    const user = userRes.rows[0] as any;

    const passMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.', code: 'ACCOUNT_BLOCKED' });
    }

    // Create session token
    const sessionToken = cryptoUUID();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pg.query(
      `INSERT INTO "Session" (id, "userId", token, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [cryptoUUID(), user.id, sessionToken, sessionExpiresAt]
    );

    // Set HTTP-only cookie
    res.cookie('superpanel_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token: sessionToken,
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
    console.error('[Login Error]:', err);
    return res.status(500).json({ success: false, message: 'Login failed.', code: 'SERVER_ERROR' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateSession, (req: AuthRequest, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', async (req: AuthRequest, res) => {
  try {
    const token = req.cookies?.superpanel_session || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await pg.query('DELETE FROM "Session" WHERE token = $1', [token]);
    }
    res.clearCookie('superpanel_session');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.clearCookie('superpanel_session');
    return res.json({ success: true, message: 'Logged out.' });
  }
});

// POST /api/auth/forgot-password (Sends OTP for password reset)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address or username is required.', code: 'INVALID_INPUT' });
    }

    const inputStr = email.trim().toLowerCase();
    
    // Support lookup by email address OR username
    const userRes = await pg.query(
      `SELECT id, email, name FROM "User" 
       WHERE LOWER(email) = $1 
          OR LOWER(name) = $1`,
      [inputStr]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found matching this email address or username.', code: 'USER_NOT_FOUND' });
    }

    const targetUser = userRes.rows[0] as any;
    const normalizedEmail = targetUser.email.toLowerCase();

    // Cooldown check (60 seconds)
    const existing = await pg.query('SELECT "createdAt" FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const lastCreated = new Date((existing.rows[0] as any).createdAt).getTime();
      const diffSec = (Date.now() - lastCreated) / 1000;
      if (diffSec < 60) {
        const remainingSec = Math.ceil(60 - diffSec);
        return res.status(429).json({ 
          success: false, 
          message: `A verification code was recently generated. Please wait ${remainingSec} second${remainingSec > 1 ? 's' : ''} before requesting another code.`, 
          code: 'COOLDOWN',
          remainingCooldownSec: remainingSec
        });
      }
    }

    const otp = generate6DigitOtp();
    const otpH = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 min expiration for password reset OTP

    await pg.query(
      `INSERT INTO "EmailOtp" (id, email, "otpHash", attempts, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, 0, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET "otpHash" = $3, attempts = 0, "expiresAt" = $4, "createdAt" = NOW()`,
      [cryptoUUID(), normalizedEmail, otpH, expiresAt]
    );

    // Send email via SMTP (await to capture status)
    await sendPasswordResetOtpEmail(normalizedEmail, otp);

    return res.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}. Please check your email inbox (and spam folder).`,
      email: normalizedEmail
    });
  } catch (err: any) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to request password reset code.', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/verify-reset-otp (Verifies OTP and generates resetToken)
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.', code: 'INVALID_INPUT' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRes = await pg.query('SELECT * FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No active verification code request found. Please request a new code.', code: 'OTP_NOT_FOUND' });
    }

    const otpRecord = otpRes.rows[0] as any;

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Maximum verification attempts exceeded. Please request a new code.', code: 'TOO_MANY_ATTEMPTS' });
    }

    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.', code: 'OTP_EXPIRED' });
    }

    const isValid = verifyOtpHash(otp.toString().trim(), otpRecord.otpHash);

    if (!isValid) {
      await pg.query('UPDATE "EmailOtp" SET attempts = attempts + 1 WHERE email = $1', [normalizedEmail]);
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.', code: 'INVALID_OTP' });
    }

    // Code is valid! Create a temporary resetToken valid for 15 minutes
    const resetToken = cryptoUUID();
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pg.query(
      `UPDATE "EmailOtp" SET "otpHash" = $1, "expiresAt" = $2, attempts = 0 WHERE email = $3`,
      ['RESET_TOKEN:' + resetToken, resetExpiresAt, normalizedEmail]
    );

    return res.json({
      success: true,
      message: 'Code verified successfully! Proceed to set a new password.',
      resetToken,
      email: normalizedEmail
    });
  } catch (err: any) {
    console.error('[Verify Reset OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'OTP verification failed.', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/reset-password (Resets password using resetToken)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.', code: 'INVALID_INPUT' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.', code: 'WEAK_PASSWORD' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.', code: 'PASSWORD_MISMATCH' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRes = await pg.query('SELECT * FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset session. Please start over.', code: 'SESSION_EXPIRED' });
    }

    const otpRecord = otpRes.rows[0] as any;

    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Password reset session has expired. Please request a new code.', code: 'SESSION_EXPIRED' });
    }

    // Verify resetToken matches
    if (resetToken) {
      if (otpRecord.otpHash !== 'RESET_TOKEN:' + resetToken) {
        return res.status(400).json({ success: false, message: 'Invalid reset authorization token.', code: 'UNAUTHORIZED' });
      }
    }

    // Hash new password and update user record
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pg.query(
      `UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2`,
      [passwordHash, normalizedEmail]
    );

    // Remove reset OTP session
    await pg.query('DELETE FROM "EmailOtp" WHERE email = $1', [normalizedEmail]);

    return res.json({
      success: true,
      message: 'Password changed successfully! You can now log in with your new password.'
    });
  } catch (err: any) {
    console.error('[Reset Password Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.', code: 'SERVER_ERROR' });
  }
});

export default router;

import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'pgdata');

let pgInstance: PGlite | null = null;

function createPgInstance(): PGlite {
  try {
    return new PGlite(dbPath);
  } catch (err) {
    console.warn('[PostgreSQL] Failed to instantiate PGlite on existing dbPath, clearing and retrying...', err);
    if (fs.existsSync(dbPath)) {
      try {
        fs.rmSync(dbPath, { recursive: true, force: true });
      } catch (e) {
        console.error('[PostgreSQL] Failed to clean dbPath:', e);
      }
    }
    return new PGlite(dbPath);
  }
}

pgInstance = createPgInstance();

export async function getPg(): Promise<PGlite> {
  if (!pgInstance) {
    pgInstance = createPgInstance();
  }
  try {
    await pgInstance.waitReady;
  } catch (err) {
    console.warn('[PostgreSQL] waitReady failed, recreating PGlite instance...', err);
    if (fs.existsSync(dbPath)) {
      try {
        fs.rmSync(dbPath, { recursive: true, force: true });
      } catch (e) {
        console.error('[PostgreSQL] Failed to clean dbPath:', e);
      }
    }
    pgInstance = new PGlite(dbPath);
    await pgInstance.waitReady;
  }
  return pgInstance;
}

export const pg = new Proxy({} as PGlite, {
  get(_target, prop) {
    if (prop === 'waitReady') {
      return (async () => {
        const instance = await getPg();
        return instance.waitReady;
      })();
    }
    return (...args: any[]) => {
      return getPg().then((instance: any) => {
        if (typeof instance[prop] === 'function') {
          return instance[prop](...args);
        }
        return instance[prop];
      });
    };
  }
});

export async function initPostgresDatabase() {
  console.log('[PostgreSQL] Initializing database schema...');

  try {
    const db = await getPg();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "walletBalance" REAL NOT NULL DEFAULT 0,
        "avatarUrl" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "EmailOtp" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "otpHash" TEXT NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Service" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "stock" INTEGER NOT NULL DEFAULT 999999,
        "imageUrl" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "providerId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        "serviceName" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "quantity" INTEGER NOT NULL,
        "total" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "link" TEXT,
        "externalOrderId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Deposit" (
        "id" TEXT PRIMARY KEY,
        "depositId" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        "transactionId" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "screenshot" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "rejectionReason" TEXT,
        "reviewedBy" TEXT,
        "reviewedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "WalletTransaction" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "balanceBefore" REAL NOT NULL,
        "balanceAfter" REAL NOT NULL,
        "referenceId" TEXT,
        "description" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id" TEXT PRIMARY KEY,
        "ticketId" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "userName" TEXT NOT NULL,
        "userEmail" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'Medium',
        "status" TEXT NOT NULL DEFAULT 'Open',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "SupportMessage" (
        "id" TEXT PRIMARY KEY,
        "ticketId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("ticketId") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'info',
        "read" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "PaymentMethod" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "accountName" TEXT NOT NULL,
        "accountNumber" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "ApiIntegration" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "baseUrl" TEXT NOT NULL,
        "apiKeyEncrypted" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "id" TEXT PRIMARY KEY,
        "key" TEXT UNIQUE NOT NULL,
        "value" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "action" TEXT NOT NULL,
        "adminId" TEXT,
        "details" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[PostgreSQL] Database tables created/verified successfully.');
  } catch (err) {
    console.error('[PostgreSQL Schema Init Error]:', err);
    throw err;
  }
}

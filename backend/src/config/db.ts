import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

export interface IDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  waitReady?: Promise<any>;
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const dbPath = process.env.PGDATA_PATH || (isServerless ? path.join('/tmp', 'pgdata') : path.join(process.cwd(), 'pgdata'));

let dbAdapter: IDatabase | null = null;
let pgliteRaw: PGlite | null = null;
let poolRaw: Pool | null = null;
let remoteFailed = false;

function isRemoteConnection(connStr?: string): boolean {
  if (!connStr) return false;
  const trimmed = connStr.trim();
  if (!trimmed.startsWith('postgresql://') && !trimmed.startsWith('postgres://')) {
    return false;
  }
  const explicitPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || process.env.PGPASSWORD || "HKb.eL&oK4'V@K";
  // If an explicit password is provided, placeholders in the URL can be overridden
  if (explicitPassword) {
    return true;
  }
  // If it contains unresolved placeholder text, do not treat as remote connection
  if (
    trimmed.includes('[YOUR-PASSWORD]') ||
    trimmed.includes('[PASSWORD]') ||
    trimmed.includes('<YOUR-PASSWORD>') ||
    trimmed.includes('<PASSWORD>') ||
    trimmed.includes('YOUR_PASSWORD') ||
    trimmed.includes('password_here')
  ) {
    return false;
  }
  return true;
}

function parsePostgresConfig(rawUrl: string): {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: any;
} {
  const isLocalhost = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');
  const ssl = isLocalhost ? false : { rejectUnauthorized: false };
  const explicitPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || process.env.PGPASSWORD || "HKb.eL&oK4'V@K";

  const trimmed = rawUrl.trim();
  const protocolMatch = trimmed.match(/^postgres(?:ql)?:\/\//);
  if (!protocolMatch) {
    return { ssl };
  }

  const withoutProtocol = trimmed.slice(protocolMatch[0].length);
  const lastAtIndex = withoutProtocol.lastIndexOf('@');
  if (lastAtIndex === -1) {
    return { ssl };
  }

  const userInfo = withoutProtocol.slice(0, lastAtIndex);
  const hostAndDb = withoutProtocol.slice(lastAtIndex + 1);

  const colonIndex = userInfo.indexOf(':');
  const user = colonIndex !== -1 ? decodeURIComponent(userInfo.slice(0, colonIndex)) : decodeURIComponent(userInfo);
  let password = colonIndex !== -1 ? userInfo.slice(colonIndex + 1) : '';

  const isPlaceholder =
    !password ||
    password.includes('[YOUR-PASSWORD]') ||
    password.includes('[PASSWORD]') ||
    password.includes('<YOUR-PASSWORD>') ||
    password.includes('<PASSWORD>') ||
    password.includes('YOUR_PASSWORD') ||
    password.includes('password_here');

  if (isPlaceholder && explicitPassword) {
    password = explicitPassword;
  } else if (password && !isPlaceholder) {
    if (password.includes('%')) {
      try {
        password = decodeURIComponent(password);
      } catch {
        // ignore
      }
    }
  } else if (explicitPassword) {
    password = explicitPassword;
  }

  const slashIndex = hostAndDb.indexOf('/');
  const hostPort = slashIndex !== -1 ? hostAndDb.slice(0, slashIndex) : hostAndDb;
  let database = slashIndex !== -1 ? hostAndDb.slice(slashIndex + 1) : 'postgres';
  const questionIndex = database.indexOf('?');
  if (questionIndex !== -1) {
    database = database.slice(0, questionIndex);
  }

  let host = hostPort;
  let port = 5432;
  const hostPortColon = hostPort.lastIndexOf(':');
  if (hostPortColon !== -1) {
    host = hostPort.slice(0, hostPortColon);
    const parsedPort = parseInt(hostPort.slice(hostPortColon + 1), 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    }
  }

  return {
    user,
    password,
    host,
    port,
    database,
    ssl,
  };
}

function createPGliteInstance(): PGlite {
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

async function getLocalAdapter(): Promise<IDatabase> {
  if (!pgliteRaw) {
    pgliteRaw = createPGliteInstance();
  }
  try {
    await pgliteRaw.waitReady;
  } catch (err) {
    console.warn('[PostgreSQL] waitReady failed, recreating PGlite instance...', err);
    if (fs.existsSync(dbPath)) {
      try {
        fs.rmSync(dbPath, { recursive: true, force: true });
      } catch (e) {
        console.error('[PostgreSQL] Failed to clean dbPath:', e);
      }
    }
    pgliteRaw = new PGlite(dbPath);
    await pgliteRaw.waitReady;
  }

  return {
    async query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
      const res = await pgliteRaw!.query<T>(sql, params);
      return { rows: res.rows };
    },
    async exec(sql: string): Promise<void> {
      await pgliteRaw!.exec(sql);
    },
    get waitReady() {
      return pgliteRaw!.waitReady;
    },
  };
}

async function tryGetRemotePool(connectionString: string): Promise<Pool | null> {
  if (remoteFailed) return null;
  if (poolRaw) return poolRaw;

  try {
    const config = parsePostgresConfig(connectionString);
    const pool = new Pool({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      database: config.database,
      ssl: config.ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });

    // Test with a lightweight query probe
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    poolRaw = pool;
    console.log('[Database] Connected to remote Supabase PostgreSQL database.');
    return poolRaw;
  } catch (err: any) {
    console.warn(`[Database] Remote PostgreSQL test failed (${err.message || err}). Falling back to local embedded database.`);
    remoteFailed = true;
    if (poolRaw) {
      poolRaw.end().catch(() => {});
      poolRaw = null;
    }
    return null;
  }
}

export async function getPg(): Promise<IDatabase> {
  if (dbAdapter) {
    return dbAdapter;
  }

  const connString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (isRemoteConnection(connString) && !remoteFailed) {
    const pool = await tryGetRemotePool(connString!.trim());
    if (pool) {
      dbAdapter = {
        async query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
          try {
            const res = await pool.query(sql, params);
            return { rows: res.rows };
          } catch (err: any) {
            const isAuthOrConnError =
              err?.code === '28P01' ||
              err?.routine === 'auth_failed' ||
              err?.message?.includes('password authentication failed') ||
              err?.message?.includes('connection') ||
              err?.code === 'ECONNREFUSED';

            if (isAuthOrConnError) {
              console.warn(`[Database] Remote query failed (${err.message}). Seamlessly switching to local database.`);
              remoteFailed = true;
              dbAdapter = await getLocalAdapter();
              return dbAdapter.query<T>(sql, params);
            }
            throw err;
          }
        },
        async exec(sql: string): Promise<void> {
          try {
            await pool.query(sql);
          } catch (err: any) {
            const isAuthOrConnError =
              err?.code === '28P01' ||
              err?.routine === 'auth_failed' ||
              err?.message?.includes('password authentication failed') ||
              err?.message?.includes('connection') ||
              err?.code === 'ECONNREFUSED';

            if (isAuthOrConnError) {
              console.warn(`[Database] Remote exec failed (${err.message}). Seamlessly switching to local database.`);
              remoteFailed = true;
              dbAdapter = await getLocalAdapter();
              return dbAdapter.exec(sql);
            }
            throw err;
          }
        },
        waitReady: Promise.resolve(),
      };
      return dbAdapter;
    }
  }

  // Fallback to local / serverless PGlite
  dbAdapter = await getLocalAdapter();
  return dbAdapter;
}

export const pg = new Proxy({} as IDatabase, {
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
  const connString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const isSupabase = isRemoteConnection(connString);
  console.log(`[Database] Initializing database schema (${isSupabase ? 'Supabase PostgreSQL' : 'PGlite'})...`);

  try {
    const db = await getPg();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "username" TEXT,
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

    // Ensure username column exists and backfill
    try {
      await db.exec(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
        UPDATE "User" SET "username" = LOWER(REPLACE("name", ' ', '')) WHERE "username" IS NULL OR "username" = '';
      `);
    } catch (migErr) {
      console.warn('[PostgreSQL Migration Warning]:', migErr);
    }

    console.log('[PostgreSQL] Database tables created/verified successfully.');
  } catch (err) {
    console.error('[PostgreSQL Schema Init Error]:', err);
    throw err;
  }
}

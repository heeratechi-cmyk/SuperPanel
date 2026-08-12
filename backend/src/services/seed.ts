import { pg } from '../config/db';
import bcrypt from 'bcryptjs';
import { cryptoUUID } from '../utils/crypto';

export async function seedDatabase() {
  // 1. Seed Default Services if empty
  const servicesCheck = await pg.query('SELECT COUNT(*) as count FROM "Service"');
  const serviceCount = parseInt((servicesCheck.rows[0] as any)?.count || '0', 10);

  if (serviceCount === 0) {
    console.log('[Seed] Inserting default SuperPanel services...');
    const defaultServices = [
      {
        id: cryptoUUID(),
        name: 'Instagram High Quality Followers [Instant]',
        category: 'Instagram',
        price: 1.50,
        description: 'Real active followers with 30-day auto refill and instant start speed.',
        stock: 500000,
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=80',
        active: true
      },
      {
        id: cryptoUUID(),
        name: 'YouTube Monetized Watch Hours (Non-Drop)',
        category: 'YouTube',
        price: 12.00,
        description: 'Safe watch time hours for channel monetization approval. Lifetime guarantee.',
        stock: 10000,
        imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=120&auto=format&fit=crop&q=80',
        active: true
      },
      {
        id: cryptoUUID(),
        name: 'TikTok Viral Post Likes & Views Pack',
        category: 'TikTok',
        price: 0.80,
        description: 'Boost FYP engagement with high retention real video views and instant likes.',
        stock: 1000000,
        imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=120&auto=format&fit=crop&q=80',
        active: true
      },
      {
        id: cryptoUUID(),
        name: 'Facebook Page Likes & Real Followers',
        category: 'Facebook',
        price: 2.20,
        description: 'Organic profile & business page likes with worldwide targeted audience.',
        stock: 250000,
        imageUrl: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=120&auto=format&fit=crop&q=80',
        active: true
      },
      {
        id: cryptoUUID(),
        name: 'Telegram Channel Members & Post Views',
        category: 'Telegram',
        price: 0.95,
        description: 'Fast non-drop channel members for crypto and trading signals communities.',
        stock: 500000,
        imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f705c?w=120&auto=format&fit=crop&q=80',
        active: true
      }
    ];

    for (const s of defaultServices) {
      await pg.query(
        `INSERT INTO "Service" (id, name, category, price, description, stock, "imageUrl", active, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [s.id, s.name, s.category, s.price, s.description, s.stock, s.imageUrl, s.active]
      );
    }
  }

  // 2. Remove legacy demo & old admin accounts if present and seed Abdullah231 admin account
  await pg.query('DELETE FROM "User" WHERE email = $1 OR email = $2', ['demo@superpanel.com', 'admin@superpanel.com']);

  const defaultAccounts = [
    { email: 'abdullah231@superpanel.com', name: 'Abdullah231', pass: 'Abdullah@231', role: 'ADMIN', balance: 5000.0 },
    { email: 'nadeem07381@gmail.com', name: 'Nadeem User', pass: 'Password123', role: 'USER', balance: 250.0 },
  ];

  for (const acc of defaultAccounts) {
    const check = await pg.query('SELECT id FROM "User" WHERE email = $1', [acc.email]);
    if (check.rows.length === 0) {
      console.log(`[Seed] Creating default account (${acc.email})...`);
      const uId = cryptoUUID();
      const passHash = await bcrypt.hash(acc.pass, 10);
      await pg.query(
        `INSERT INTO "User" (id, name, email, "passwordHash", role, status, "emailVerified", "walletBalance", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true, $6, NOW(), NOW())`,
        [uId, acc.name, acc.email, passHash, acc.role, acc.balance]
      );
    } else {
      // Update passwordHash & ensure emailVerified = true
      const passHash = await bcrypt.hash(acc.pass, 10);
      await pg.query(
        `UPDATE "User" SET "passwordHash" = $1, "emailVerified" = true, status = 'ACTIVE' WHERE email = $2`,
        [passHash, acc.email]
      );
    }
  }

  // 3. Seed Payment Methods
  const pmCheck = await pg.query('SELECT COUNT(*) as count FROM "PaymentMethod"');
  if (parseInt((pmCheck.rows[0] as any)?.count || '0', 10) === 0) {
    await pg.query(
      `INSERT INTO "PaymentMethod" (id, name, "accountName", "accountNumber", active)
       VALUES ($1, $2, $3, $4, $5)`,
      [cryptoUUID(), 'JazzCash', 'Shabnam Nadeem', '03369917075', true]
    );
    await pg.query(
      `INSERT INTO "PaymentMethod" (id, name, "accountName", "accountNumber", active)
       VALUES ($1, $2, $3, $4, $5)`,
      [cryptoUUID(), 'SadaPay', 'Shabnam Nadeem', '03369917075', true]
    );
  }
}

import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';

const router = Router();

// GET /api/orders
router.get('/', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const ordersRes = await pg.query(
      `SELECT id, "orderId", "userId", "serviceId", "serviceName", category, price, quantity, total, status, link, "externalOrderId", "createdAt"
       FROM "Order"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [userId]
    );

    const orders = ordersRes.rows.map((row: any) => ({
      id: row.id,
      orderId: row.orderId,
      userId: row.userId,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity, 10),
      total: parseFloat(row.total),
      status: row.status,
      link: row.link || null,
      externalOrderId: row.externalOrderId || null,
      createdAt: new Date(row.createdAt).toISOString()
    }));

    return res.json({ success: true, orders });
  } catch (err: any) {
    console.error('[Get Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateSession, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const orderRes = await pg.query(
      `SELECT id, "orderId", "userId", "serviceId", "serviceName", category, price, quantity, total, status, link, "externalOrderId", "createdAt"
       FROM "Order"
       WHERE "userId" = $1 AND ("id" = $2 OR "orderId" = $2)`,
      [userId, id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const row = orderRes.rows[0] as any;
    const order = {
      id: row.id,
      orderId: row.orderId,
      userId: row.userId,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity, 10),
      total: parseFloat(row.total),
      status: row.status,
      link: row.link || null,
      externalOrderId: row.externalOrderId || null,
      createdAt: new Date(row.createdAt).toISOString()
    };

    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// POST /api/orders
router.post('/', authenticateSession, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { serviceId, quantity, link } = req.body;

  const parsedQty = parseInt(quantity, 10);
  if (!serviceId || isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ success: false, message: 'Valid service ID and quantity (> 0) are required.', code: 'INVALID_INPUT' });
  }

  // Begin PostgreSQL Transaction
  try {
    await pg.query('BEGIN');

    // 1. Fetch service details
    const serviceRes = await pg.query('SELECT * FROM "Service" WHERE id = $1', [serviceId]);
    if (serviceRes.rows.length === 0) {
      await pg.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Service not found or unavailable.', code: 'SERVICE_NOT_FOUND' });
    }

    const service = serviceRes.rows[0] as any;
    if (!service.active) {
      await pg.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This service is currently disabled.', code: 'SERVICE_INACTIVE' });
    }

    if (service.stock < parsedQty) {
      await pg.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Insufficient stock. Only ${service.stock} available.`, code: 'OUT_OF_STOCK' });
    }

    // 2. Server-side total calculation
    const unitPrice = parseFloat(service.price);
    const totalCost = unitPrice * parsedQty;

    // 3. Lock user row & check wallet balance
    const userRes = await pg.query('SELECT "walletBalance" FROM "User" WHERE id = $1 FOR UPDATE', [userId]);
    const currentBalance = parseFloat((userRes.rows[0] as any).walletBalance);

    if (currentBalance < totalCost) {
      await pg.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Total required: $${totalCost.toFixed(2)}, Current Balance: $${currentBalance.toFixed(2)}. Please add funds to your wallet.`,
        code: 'INSUFFICIENT_FUNDS'
      });
    }

    // 4. Deduct wallet balance
    const newBalance = currentBalance - totalCost;
    await pg.query('UPDATE "User" SET "walletBalance" = $1, "updatedAt" = NOW() WHERE id = $2', [newBalance, userId]);

    // 5. Create Order
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const orderId = cryptoUUID();

    await pg.query(
      `INSERT INTO "Order" (id, "orderId", "userId", "serviceId", "serviceName", category, price, quantity, total, status, link, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PROCESSING', $10, NOW(), NOW())`,
      [orderId, orderNumber, userId, service.id, service.name, service.category, unitPrice, parsedQty, totalCost, link ? link.trim() : null]
    );

    // 6. Create OrderItem
    await pg.query(
      `INSERT INTO "OrderItem" (id, "orderId", "serviceId", quantity, "unitPrice", "totalPrice")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cryptoUUID(), orderId, service.id, parsedQty, unitPrice, totalCost]
    );

    // 7. Create WalletTransaction
    const txId = cryptoUUID();
    await pg.query(
      `INSERT INTO "WalletTransaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt")
       VALUES ($1, $2, 'PURCHASE', $3, $4, $5, $6, $7, NOW())`,
      [txId, userId, totalCost, currentBalance, newBalance, orderNumber, `Order #${orderNumber} - ${service.name}`]
    );

    // 8. Create Notification
    await pg.query(
      `INSERT INTO "Notification" (id, "userId", title, message, type, read, "createdAt")
       VALUES ($1, $2, $3, $4, 'info', false, NOW())`,
      [cryptoUUID(), userId, 'Order Placed Successfully', `Your order #${orderNumber} for ${service.name} was created. Total: $${totalCost.toFixed(2)}.`]
    );

    // Commit Transaction
    await pg.query('COMMIT');

    return res.json({
      success: true,
      message: `Order #${orderNumber} placed successfully!`,
      order: {
        id: orderId,
        orderId: orderNumber,
        serviceName: service.name,
        quantity: parsedQty,
        total: totalCost,
        status: 'PROCESSING',
        newWalletBalance: newBalance,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    await pg.query('ROLLBACK');
    console.error('[Create Order Transaction Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to place order. Transaction rolled back.', code: 'SERVER_ERROR' });
  }
});

export default router;

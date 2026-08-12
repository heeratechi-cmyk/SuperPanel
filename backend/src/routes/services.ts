import { Router } from 'express';
import { pg } from '../config/db';
import { authenticateSession, requireAdmin, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';

const router = Router();

// GET /api/services
router.get('/', async (_req, res) => {
  try {
    const servicesRes = await pg.query(
      `SELECT id, name, description, category, price, stock, "imageUrl", active, "providerId", "createdAt", "updatedAt"
       FROM "Service"
       ORDER BY category ASC, name ASC`
    );

    const services = servicesRes.rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      price: parseFloat(s.price),
      stock: parseInt(s.stock, 10),
      imageUrl: s.imageUrl || null,
      active: Boolean(s.active),
      providerId: s.providerId || null,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString()
    }));

    return res.json({ success: true, services });
  } catch (err: any) {
    console.error('[Get Services Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
});

// POST /api/services (Admin only)
router.post('/', authenticateSession, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, category, price, stock, imageUrl, active, providerId } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required.', code: 'INVALID_INPUT' });
    }

    const id = cryptoUUID();
    const parsedPrice = parseFloat(price);
    const parsedStock = stock !== undefined ? parseInt(stock, 10) : 999999;

    await pg.query(
      `INSERT INTO "Service" (id, name, description, category, price, stock, "imageUrl", active, "providerId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [id, name.trim(), description || '', category.trim(), parsedPrice, parsedStock, imageUrl || null, active !== false, providerId || null]
    );

    return res.json({ success: true, message: 'Service created successfully.', serviceId: id });
  } catch (err: any) {
    console.error('[Create Service Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
});

// PATCH /api/services/:id (Admin only)
router.patch('/:id', authenticateSession, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, imageUrl, active, providerId } = req.body;

    const existing = await pg.query('SELECT id FROM "Service" WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    await pg.query(
      `UPDATE "Service"
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           price = COALESCE($4, price),
           stock = COALESCE($5, stock),
           "imageUrl" = COALESCE($6, "imageUrl"),
           active = COALESCE($7, active),
           "providerId" = COALESCE($8, "providerId"),
           "updatedAt" = NOW()
       WHERE id = $9`,
      [name, description, category, price !== undefined ? parseFloat(price) : null, stock !== undefined ? parseInt(stock, 10) : null, imageUrl, active, providerId, id]
    );

    return res.json({ success: true, message: 'Service updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
});

// DELETE /api/services/:id (Admin only)
router.delete('/:id', authenticateSession, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await pg.query('DELETE FROM "Service" WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Service deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
});

export default router;

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateSession, AuthRequest } from '../middleware/auth';
import { cryptoUUID } from '../utils/crypto';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}_${cryptoUUID().substring(0, 8)}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// POST /api/uploads
router.post('/', authenticateSession, upload.single('file'), (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.', code: 'NO_FILE' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      message: 'File uploaded successfully.',
      url: fileUrl
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'File upload failed.', code: 'UPLOAD_ERROR' });
  }
});

export default router;

// ============================================================
// NavDrishti Backend - File Upload Routes
// ============================================================
// Handles image and voice recording uploads for waypoints.
// Files are stored locally in the uploads/ directory.
// ============================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mpeg',
            'audio/wav', 'audio/mp4'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// ---- Upload image ----
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
});

// ---- Upload voice recording ----
router.post('/voice', authMiddleware, upload.single('voice'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No voice file provided' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
});

module.exports = router;

// ============================================================
// NavDrishti Backend - Children Routes (sql.js)
// ============================================================

const express = require('express');
const { queryAll, queryOne, runSql, execSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ---- List guardian's children ----
router.get('/', (req, res) => {
    try {
        const children = queryAll(
            'SELECT * FROM children WHERE guardian_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ children });
    } catch (err) {
        console.error('List children error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get a single child ----
router.get('/:id', (req, res) => {
    try {
        const child = queryOne(
            'SELECT * FROM children WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!child) return res.status(404).json({ error: 'Child not found' });
        res.json({ child });
    } catch (err) {
        console.error('Get child error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Add a child ----
router.post('/', (req, res) => {
    try {
        const { name, device_id, avatar, age, parent_name, parent_phone, address, medical_notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Child name is required' });

        const result = runSql(
            `INSERT INTO children (guardian_id, name, device_id, avatar, age, parent_name, parent_phone, address, medical_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, device_id || null, avatar || '👦',
             age || null, parent_name || null, parent_phone || null, address || null, medical_notes || null]
        );

        const child = queryOne('SELECT * FROM children WHERE id = ?', [result.lastInsertRowid]);
        res.status(201).json({ child });
    } catch (err) {
        console.error('Add child error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Update a child ----
router.put('/:id', (req, res) => {
    try {
        const { name, device_id, avatar, age, parent_name, parent_phone, address, medical_notes } = req.body;
        const child = queryOne(
            'SELECT * FROM children WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!child) return res.status(404).json({ error: 'Child not found' });

        execSql(
            `UPDATE children SET
               name = ?, device_id = ?, avatar = ?, age = ?,
               parent_name = ?, parent_phone = ?, address = ?, medical_notes = ?
             WHERE id = ?`,
            [
                name || child.name,
                device_id !== undefined ? device_id : child.device_id,
                avatar || child.avatar,
                age !== undefined ? age : child.age,
                parent_name !== undefined ? parent_name : child.parent_name,
                parent_phone !== undefined ? parent_phone : child.parent_phone,
                address !== undefined ? address : child.address,
                medical_notes !== undefined ? medical_notes : child.medical_notes,
                parseInt(req.params.id)
            ]
        );

        const updated = queryOne('SELECT * FROM children WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ child: updated });
    } catch (err) {
        console.error('Update child error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Delete a child ----
router.delete('/:id', (req, res) => {
    try {
        const child = queryOne(
            'SELECT * FROM children WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!child) return res.status(404).json({ error: 'Child not found' });

        execSql('DELETE FROM children WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ message: 'Child removed successfully' });
    } catch (err) {
        console.error('Delete child error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

// ============================================================
// NavDrishti Backend - Notification Routes (sql.js)
// ============================================================

const express = require('express');
const { queryAll, queryOne, runSql, execSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ---- Get all notifications for the guardian's children ----
router.get('/', (req, res) => {
    try {
        const notifications = queryAll(`
            SELECT n.*, c.name as child_name, c.avatar as child_avatar
            FROM notifications n
            JOIN children c ON n.child_id = c.id
            WHERE c.guardian_id = ?
            ORDER BY n.created_at DESC
            LIMIT 100
        `, [req.user.id]);

        const unreadCount = queryOne(`
            SELECT COUNT(*) as count
            FROM notifications n
            JOIN children c ON n.child_id = c.id
            WHERE c.guardian_id = ? AND n.is_read = 0
        `, [req.user.id]);

        res.json({
            notifications,
            unread_count: unreadCount ? unreadCount.count : 0
        });
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get unread count only (lightweight) ----
router.get('/unread-count', (req, res) => {
    try {
        const result = queryOne(`
            SELECT COUNT(*) as count
            FROM notifications n
            JOIN children c ON n.child_id = c.id
            WHERE c.guardian_id = ? AND n.is_read = 0
        `, [req.user.id]);
        res.json({ unread_count: result ? result.count : 0 });
    } catch (err) {
        console.error('Unread count error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Mark a notification as read ----
router.put('/:id/read', (req, res) => {
    try {
        // Verify notification belongs to guardian's child
        const notif = queryOne(`
            SELECT n.* FROM notifications n
            JOIN children c ON n.child_id = c.id
            WHERE n.id = ? AND c.guardian_id = ?
        `, [parseInt(req.params.id), req.user.id]);

        if (!notif) return res.status(404).json({ error: 'Notification not found' });

        execSql('UPDATE notifications SET is_read = 1 WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Mark all notifications as read ----
router.put('/read-all', (req, res) => {
    try {
        execSql(`
            UPDATE notifications SET is_read = 1
            WHERE child_id IN (SELECT id FROM children WHERE guardian_id = ?)
        `, [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all read error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

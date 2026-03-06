// ============================================================
// NavDrishti Backend - Routes & Waypoints API (sql.js)
// ============================================================

const express = require('express');
const { queryAll, queryOne, runSql, execSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ---- List all routes for guardian ----
router.get('/', (req, res) => {
    try {
        const routes = queryAll(`
      SELECT r.*, c.name as child_name,
        (SELECT COUNT(*) FROM waypoints WHERE route_id = r.id) as waypoint_count
      FROM routes r
      LEFT JOIN children c ON r.child_id = c.id
      WHERE r.guardian_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
        res.json({ routes });
    } catch (err) {
        console.error('List routes error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get a single route with waypoints ----
router.get('/:id', (req, res) => {
    try {
        const route = queryOne(
            'SELECT * FROM routes WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!route) return res.status(404).json({ error: 'Route not found' });

        const waypoints = queryAll(
            'SELECT * FROM waypoints WHERE route_id = ? ORDER BY step_number ASC',
            [parseInt(req.params.id)]
        );

        res.json({ route: { ...route, waypoints } });
    } catch (err) {
        console.error('Get route error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Create a route with waypoints ----
router.post('/', (req, res) => {
    try {
        const { route_name, child_id, waypoints } = req.body;
        if (!route_name) return res.status(400).json({ error: 'Route name is required' });

        const routeResult = runSql(
            'INSERT INTO routes (guardian_id, child_id, route_name) VALUES (?, ?, ?)',
            [req.user.id, child_id || null, route_name]
        );
        const routeId = routeResult.lastInsertRowid;

        // Insert waypoints
        if (waypoints && waypoints.length > 0) {
            waypoints.forEach((wp, index) => {
                runSql(
                    `INSERT INTO waypoints (route_id, latitude, longitude, image_url, voice_url, instruction_text, step_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [routeId, wp.latitude, wp.longitude, wp.image_url || null, wp.voice_url || null, wp.instruction_text || null, wp.step_number || index + 1]
                );
            });
        }

        const route = queryOne('SELECT * FROM routes WHERE id = ?', [routeId]);
        const savedWaypoints = queryAll(
            'SELECT * FROM waypoints WHERE route_id = ? ORDER BY step_number ASC',
            [routeId]
        );

        res.status(201).json({ route: { ...route, waypoints: savedWaypoints } });
    } catch (err) {
        console.error('Create route error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Update a route ----
router.put('/:id', (req, res) => {
    try {
        const { route_name, child_id, waypoints } = req.body;
        const route = queryOne(
            'SELECT * FROM routes WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!route) return res.status(404).json({ error: 'Route not found' });

        execSql(
            'UPDATE routes SET route_name = ?, child_id = ? WHERE id = ?',
            [route_name || route.route_name, child_id !== undefined ? child_id : route.child_id, parseInt(req.params.id)]
        );

        // Replace waypoints if provided
        if (waypoints && waypoints.length > 0) {
            execSql('DELETE FROM waypoints WHERE route_id = ?', [parseInt(req.params.id)]);
            waypoints.forEach((wp, index) => {
                runSql(
                    `INSERT INTO waypoints (route_id, latitude, longitude, image_url, voice_url, instruction_text, step_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [parseInt(req.params.id), wp.latitude, wp.longitude, wp.image_url || null, wp.voice_url || null, wp.instruction_text || null, wp.step_number || index + 1]
                );
            });
        }

        const updated = queryOne('SELECT * FROM routes WHERE id = ?', [parseInt(req.params.id)]);
        const savedWaypoints = queryAll(
            'SELECT * FROM waypoints WHERE route_id = ? ORDER BY step_number ASC',
            [parseInt(req.params.id)]
        );

        res.json({ route: { ...updated, waypoints: savedWaypoints } });
    } catch (err) {
        console.error('Update route error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Delete a route ----
router.delete('/:id', (req, res) => {
    try {
        const route = queryOne(
            'SELECT * FROM routes WHERE id = ? AND guardian_id = ?',
            [req.params.id, req.user.id]
        );
        if (!route) return res.status(404).json({ error: 'Route not found' });

        execSql('DELETE FROM routes WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ message: 'Route deleted successfully' });
    } catch (err) {
        console.error('Delete route error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get routes for a child (for watch app) ----
router.get('/child/:childId', (req, res) => {
    try {
        const routes = queryAll(
            'SELECT r.* FROM routes r WHERE r.child_id = ? ORDER BY r.created_at DESC',
            [parseInt(req.params.childId)]
        );

        const routesWithWaypoints = routes.map(route => {
            const waypoints = queryAll(
                'SELECT * FROM waypoints WHERE route_id = ? ORDER BY step_number ASC',
                [route.id]
            );
            return { ...route, waypoints };
        });

        res.json({ routes: routesWithWaypoints });
    } catch (err) {
        console.error('Get child routes error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

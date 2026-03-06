// ============================================================
// NavDrishti Backend - Location Tracking Routes (sql.js)
// ============================================================

const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ---- Log child location ----
router.post('/log', (req, res) => {
    try {
        const { child_id, latitude, longitude } = req.body;
        if (!child_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'child_id, latitude, and longitude are required' });
        }

        runSql(
            'INSERT INTO location_logs (child_id, latitude, longitude) VALUES (?, ?, ?)',
            [child_id, latitude, longitude]
        );
        res.status(201).json({ message: 'Location logged' });
    } catch (err) {
        console.error('Location log error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get latest location ----
router.get('/latest/:childId', (req, res) => {
    try {
        const location = queryOne(
            'SELECT * FROM location_logs WHERE child_id = ? ORDER BY timestamp DESC LIMIT 1',
            [parseInt(req.params.childId)]
        );
        if (!location) return res.status(404).json({ error: 'No location data found' });
        res.json({ location });
    } catch (err) {
        console.error('Get latest location error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Get location history ----
router.get('/history/:childId', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const locations = queryAll(
            'SELECT * FROM location_logs WHERE child_id = ? ORDER BY timestamp DESC LIMIT ?',
            [parseInt(req.params.childId), limit]
        );
        res.json({ locations });
    } catch (err) {
        console.error('Get location history error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Check geofence ----
router.get('/geofence/:childId/:routeId', (req, res) => {
    try {
        const { childId, routeId } = req.params;
        const radiusMeters = parseFloat(req.query.radius) || 50;

        const location = queryOne(
            'SELECT * FROM location_logs WHERE child_id = ? ORDER BY timestamp DESC LIMIT 1',
            [parseInt(childId)]
        );
        if (!location) return res.json({ on_route: false, message: 'No location data' });

        const waypoints = queryAll(
            'SELECT * FROM waypoints WHERE route_id = ? ORDER BY step_number ASC',
            [parseInt(routeId)]
        );

        let nearestWaypoint = null;
        let minDistance = Infinity;

        waypoints.forEach(wp => {
            const distance = haversineDistance(
                location.latitude, location.longitude,
                wp.latitude, wp.longitude
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestWaypoint = wp;
            }
        });

        res.json({
            on_route: minDistance <= radiusMeters,
            distance_to_nearest: Math.round(minDistance),
            nearest_waypoint: nearestWaypoint,
            child_location: { latitude: location.latitude, longitude: location.longitude }
        });
    } catch (err) {
        console.error('Geofence check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;

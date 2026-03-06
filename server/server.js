// ============================================================
// NavDrishti Backend - Express Server
// ============================================================
// Main entry point. Initializes database, then starts Express
// with CORS, JSON parsing, static file serving, and API routes.
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB, queryAll } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Ensure uploads directory exists ----
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (images, voice recordings)
app.use('/uploads', express.static(uploadsDir));

// Serve the watch app as a static site
app.use('/watch', express.static(path.join(__dirname, '..', 'watch-app')));

// ---- API Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/children', require('./routes/children'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/location', require('./routes/location'));
app.use('/api/upload', require('./routes/upload'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'NavDrishti', timestamp: new Date().toISOString() });
});

// ---- Public route endpoint for watch app (no auth needed) ----
app.get('/api/public/routes/:childId', (req, res) => {
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
        console.error('Public routes error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- Initialize DB then start server ----
async function start() {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log('');
            console.log('  ╔══════════════════════════════════════════╗');
            console.log('  ║       🧭  NavDrishti Backend Server      ║');
            console.log('  ╠══════════════════════════════════════════╣');
            console.log(`  ║  API:   http://localhost:${PORT}/api        ║`);
            console.log(`  ║  Watch: http://localhost:${PORT}/watch       ║`);
            console.log('  ╚══════════════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();

module.exports = app;

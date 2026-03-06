// ============================================================
// NavDrishti - Dashboard Page
// ============================================================
// Overview showing statistics, recent routes, and children.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [routesRes, childrenRes] = await Promise.all([
                api.get('/routes'),
                api.get('/children')
            ]);
            setRoutes(routesRes.data.routes || []);
            setChildren(childrenRes.data.children || []);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Welcome, {user?.name} 👋</h2>
                <p>Here's an overview of your NavDrishti dashboard</p>
            </div>

            {/* Stats */}
            <div className="cards-grid" style={{ marginBottom: '2rem' }}>
                <div className="glass-card stat-card">
                    <div className="stat-icon blue">👧</div>
                    <div className="stat-info">
                        <h3>{children.length}</h3>
                        <p>Children</p>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon green">🗺️</div>
                    <div className="stat-info">
                        <h3>{routes.length}</h3>
                        <p>Saved Routes</p>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon purple">📍</div>
                    <div className="stat-info">
                        <h3>{routes.reduce((sum, r) => sum + (r.waypoint_count || 0), 0)}</h3>
                        <p>Total Waypoints</p>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon orange">⌚</div>
                    <div className="stat-info">
                        <h3>{children.filter(c => c.device_id).length}</h3>
                        <p>Paired Devices</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate('/routes/new')}>
                    ➕ Create Route
                </button>
                <button className="btn btn-success" onClick={() => navigate('/children')}>
                    👧 Manage Children
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/tracking')}>
                    📍 Live Tracking
                </button>
                <a
                    href="http://localhost:3001/watch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green-light)' }}
                >
                    ⌚ Open Watch App
                </a>
            </div>

            {/* Connected Apps Banner */}
            <div className="glass-card" style={{
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>🔗</span>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>Apps Connected</h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            Guardian App ↔ Watch App are linked. Routes you create here appear on the watch.
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {children.map(c => (
                        <a
                            key={c.id}
                            href={`http://localhost:3001/watch?child=${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: 'var(--font-size-xs)' }}
                        >
                            {c.avatar} {c.name}'s Watch
                        </a>
                    ))}
                    {children.length === 0 && (
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/children')}>
                            Add a Child First
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Routes */}
            <div className="page-header">
                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Recent Routes</h2>
            </div>

            {routes.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">🗺️</div>
                    <h3>No routes yet</h3>
                    <p>Create your first route to get started!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/routes/new')} style={{ marginTop: '1rem' }}>
                        ➕ Create Your First Route
                    </button>
                </div>
            ) : (
                <div className="cards-grid">
                    {routes.slice(0, 6).map(route => (
                        <div
                            key={route.id}
                            className="glass-card route-card"
                            onClick={() => navigate(`/routes/${route.id}`)}
                        >
                            <div className="route-card-header">
                                <h3>{route.route_name}</h3>
                                <span className="badge badge-blue">{route.waypoint_count || 0} steps</span>
                            </div>
                            <div className="route-meta">
                                {route.child_name && (
                                    <span>👧 {route.child_name}</span>
                                )}
                                <span>📅 {new Date(route.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

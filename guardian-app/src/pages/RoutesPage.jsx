// ============================================================
// NavDrishti - Routes List Page
// ============================================================
// Shows all saved routes with search, and options to edit/delete.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function RoutesPage() {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            const res = await api.get('/routes');
            setRoutes(res.data.routes || []);
        } catch (err) {
            console.error('Failed to load routes:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteRoute = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this route?')) return;
        try {
            await api.delete(`/routes/${id}`);
            setRoutes(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('Failed to delete route');
        }
    };

    const filtered = routes.filter(r =>
        r.route_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2>Routes 🗺️</h2>
                        <p>Manage your navigation routes</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/routes/new')}>
                        ➕ Create Route
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="🔍 Search routes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '400px' }}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">🗺️</div>
                    <h3>{search ? 'No routes found' : 'No routes yet'}</h3>
                    <p>{search ? 'Try a different search term' : 'Create your first navigation route!'}</p>
                    {!search && (
                        <button className="btn btn-primary" onClick={() => navigate('/routes/new')} style={{ marginTop: '1rem' }}>
                            ➕ Create Route
                        </button>
                    )}
                </div>
            ) : (
                <div className="cards-grid">
                    {filtered.map(route => (
                        <div
                            key={route.id}
                            className="glass-card route-card"
                            onClick={() => navigate(`/routes/${route.id}`)}
                        >
                            <div className="route-card-header">
                                <h3>{route.route_name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span className="badge badge-blue">{route.waypoint_count || 0} steps</span>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={(e) => deleteRoute(route.id, e)}
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="route-meta">
                                {route.child_name && <span>👧 {route.child_name}</span>}
                                <span>📅 {new Date(route.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

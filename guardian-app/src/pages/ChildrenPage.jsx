// ============================================================
// NavDrishti - Children Management Page
// ============================================================
// Add, edit, and manage children linked to the guardian.
// Each child can be assigned a device ID and avatar.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../api';

const AVATARS = ['👦', '👧', '🧒', '👶', '🧒🏽', '👦🏻', '👧🏻', '👦🏾', '👧🏾'];

export default function ChildrenPage() {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [form, setForm] = useState({ name: '', device_id: '', avatar: '👦' });

    useEffect(() => {
        loadChildren();
    }, []);

    const loadChildren = async () => {
        try {
            const res = await api.get('/children');
            setChildren(res.data.children || []);
        } catch (err) {
            console.error('Failed to load children:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (child = null) => {
        if (child) {
            setEditingChild(child);
            setForm({ name: child.name, device_id: child.device_id || '', avatar: child.avatar || '👦' });
        } else {
            setEditingChild(null);
            setForm({ name: '', device_id: '', avatar: '👦' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingChild) {
                const res = await api.put(`/children/${editingChild.id}`, form);
                setChildren(prev => prev.map(c => c.id === editingChild.id ? res.data.child : c));
            } else {
                const res = await api.post('/children', form);
                setChildren(prev => [res.data.child, ...prev]);
            }
            setShowModal(false);
        } catch (err) {
            alert('Failed to save. Please try again.');
        }
    };

    const deleteChild = async (id) => {
        if (!confirm('Are you sure? This will also remove their routes.')) return;
        try {
            await api.delete(`/children/${id}`);
            setChildren(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Failed to delete child');
        }
    };

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2>Children 👧</h2>
                        <p>Manage children and their devices</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        ➕ Add Child
                    </button>
                </div>
            </div>

            {children.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">👧</div>
                    <h3>No children added</h3>
                    <p>Add your first child to get started!</p>
                    <button className="btn btn-primary" onClick={() => openModal()} style={{ marginTop: '1rem' }}>
                        ➕ Add Child
                    </button>
                </div>
            ) : (
                <div className="cards-grid">
                    {children.map(child => (
                        <div key={child.id} className="glass-card child-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="child-avatar">{child.avatar}</div>
                                <div className="child-info" style={{ flex: 1 }}>
                                    <h3>{child.name}</h3>
                                    <p>{child.device_id ? `📱 ${child.device_id}` : '⌚ No device paired'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => openModal(child)}>
                                    ✏️ Edit
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteChild(child.id)}>
                                    🗑️
                                </button>
                            </div>

                            {/* Watch App Link */}
                            <div style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--accent-blue-light)'
                            }}>
                                ⌚ Watch App URL: <a href={`http://localhost:3001/watch?child=${child.id}`} target="_blank" rel="noopener">
                                    localhost:3001/watch?child={child.id}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingChild ? 'Edit Child' : 'Add Child'}</h3>
                            <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label>Child's Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Device ID (optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Smartwatch device ID"
                                    value={form.device_id}
                                    onChange={(e) => setForm({ ...form, device_id: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label>Avatar</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {AVATARS.map(avatar => (
                                        <button
                                            key={avatar}
                                            type="button"
                                            onClick={() => setForm({ ...form, avatar })}
                                            style={{
                                                fontSize: '2rem',
                                                padding: '0.5rem',
                                                background: form.avatar === avatar ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                border: form.avatar === avatar ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                transition: 'all var(--transition-fast)',
                                            }}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="btn btn-primary" type="submit">
                                {editingChild ? '💾 Save Changes' : '➕ Add Child'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

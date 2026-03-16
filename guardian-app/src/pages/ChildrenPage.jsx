// ============================================================
// NavDrishti - Children Management Page
// ============================================================
// Add, edit, and manage children linked to the guardian.
// Each child stores child details + parent contact + address.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AVATARS = ['👦', '👧', '🧒', '👶', '🧒🏽', '👦🏻', '👧🏻', '👦🏾', '👧🏾'];

const EMPTY_FORM = {
    name: '', age: '', device_id: '', avatar: '👦',
    parent_name: '', parent_phone: '', address: '', medical_notes: ''
};

export default function ChildrenPage() {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [activeTab, setActiveTab] = useState('child'); // 'child' | 'parent'

    useEffect(() => { loadChildren(); }, []);

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
            setForm({
                name: child.name || '',
                age: child.age || '',
                device_id: child.device_id || '',
                avatar: child.avatar || '👦',
                parent_name: child.parent_name || '',
                parent_phone: child.parent_phone || '',
                address: child.address || '',
                medical_notes: child.medical_notes || '',
            });
        } else {
            setEditingChild(null);
            setForm(EMPTY_FORM);
        }
        setActiveTab('child');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, age: form.age ? parseInt(form.age) : null };
            if (editingChild) {
                const res = await api.put(`/children/${editingChild.id}`, payload);
                setChildren(prev => prev.map(c => c.id === editingChild.id ? res.data.child : c));
            } else {
                const res = await api.post('/children', payload);
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

    const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2>Children 👧</h2>
                        <p>Manage children and parent contact details</p>
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
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="child-avatar">{child.avatar}</div>
                                <div className="child-info" style={{ flex: 1 }}>
                                    <h3>{child.name} {child.age ? <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>({child.age}y)</span> : null}</h3>
                                    <p>{child.device_id ? `⌚ ${child.device_id}` : '⌚ No device paired'}</p>
                                </div>
                            </div>

                            {/* Parent/Contact Info */}
                            <div style={{
                                background: 'rgba(59,130,246,0.07)', borderRadius: 'var(--radius-sm)',
                                padding: '0.75rem', marginBottom: '0.75rem',
                                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                                fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)'
                            }}>
                                {child.parent_name && <span>👨‍👩‍👧 <strong style={{ color: 'var(--text-primary)' }}>{child.parent_name}</strong></span>}
                                {child.parent_phone && (
                                    <span>📞 <a href={`tel:${child.parent_phone}`} style={{ color: 'var(--accent-blue-light)' }}>{child.parent_phone}</a></span>
                                )}
                                {child.address && <span>📍 {child.address}</span>}
                                {child.medical_notes && <span>🏥 {child.medical_notes}</span>}
                                {!child.parent_name && !child.parent_phone && !child.address && (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No parent details — click Edit to add</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => openModal(child)}>✏️ Edit</button>
                                <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/tracking?child=${child.id}`)}>📍 Track</button>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteChild(child.id)}>🗑️</button>
                            </div>

                            {/* Watch App Link */}
                            <div style={{
                                marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                                background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--font-size-xs)', color: 'var(--accent-blue-light)'
                            }}>
                                ⌚ Watch App: <a href={`http://localhost:3001/watch?child=${child.id}`} target="_blank" rel="noopener">
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
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                        <div className="modal-header">
                            <h3>{editingChild ? '✏️ Edit Child' : '➕ Add Child'}</h3>
                            <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                            {[['child', '👧 Child Info'], ['parent', '👨‍👩‍👧 Parent Details']].map(([tab, label]) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)',
                                        fontSize: 'var(--font-size-sm)', fontWeight: 600,
                                        background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
                                        color: activeTab === tab ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >{label}</button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Child Info Tab */}
                            {activeTab === 'child' && <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>Child's Name *</label>
                                        <input type="text" className="input-field" placeholder="Enter name" required {...f('name')} />
                                    </div>
                                    <div className="input-group">
                                        <label>Age</label>
                                        <input type="number" className="input-field" placeholder="e.g. 8" min="1" max="18" {...f('age')} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Device ID (optional)</label>
                                    <input type="text" className="input-field" placeholder="Smartwatch device ID" {...f('device_id')} />
                                </div>

                                <div className="input-group">
                                    <label>Medical Notes (allergies, conditions)</label>
                                    <textarea className="input-field" placeholder="e.g. Nut allergy, uses inhaler" rows={2} style={{ resize: 'vertical' }} {...f('medical_notes')} />
                                </div>

                                <div className="input-group">
                                    <label>Avatar</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {AVATARS.map(avatar => (
                                            <button
                                                key={avatar} type="button"
                                                onClick={() => setForm({ ...form, avatar })}
                                                style={{
                                                    fontSize: '2rem', padding: '0.5rem',
                                                    background: form.avatar === avatar ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                    border: form.avatar === avatar ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                    transition: 'all var(--transition-fast)',
                                                }}
                                            >{avatar}</button>
                                        ))}
                                    </div>
                                </div>

                                <button type="button" className="btn btn-outline" onClick={() => setActiveTab('parent')} style={{ alignSelf: 'flex-start' }}>
                                    Next: Parent Details →
                                </button>
                            </>}

                            {/* Parent Details Tab */}
                            {activeTab === 'parent' && <>
                                <div className="input-group">
                                    <label>Parent / Guardian Name</label>
                                    <input type="text" className="input-field" placeholder="e.g. Rajesh Kumar" {...f('parent_name')} />
                                </div>

                                <div className="input-group">
                                    <label>Contact Phone Number</label>
                                    <input type="tel" className="input-field" placeholder="e.g. +91 98765 43210" {...f('parent_phone')} />
                                </div>

                                <div className="input-group">
                                    <label>Home Address</label>
                                    <textarea className="input-field" placeholder="Full home address" rows={3} style={{ resize: 'vertical' }} {...f('address')} />
                                </div>
                            </>}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                {activeTab === 'parent' && (
                                    <button type="button" className="btn btn-outline" onClick={() => setActiveTab('child')}>← Child Info</button>
                                )}
                                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                                    {editingChild ? '💾 Save Changes' : '➕ Add Child'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

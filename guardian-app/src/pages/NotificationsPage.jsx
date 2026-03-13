// ============================================================
// NavDrishti - Notifications Page
// ============================================================
// Shows all notifications from children's watch activities
// (SOS alerts, navigation start/complete, etc.)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const NOTIFICATION_CONFIG = {
    sos: { icon: '🚨', label: 'SOS Alert', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
    navigation_start: { icon: '🚶', label: 'Navigation Started', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' },
    navigation_complete: { icon: '✅', label: 'Arrived Safely', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
    off_route: { icon: '⚠️', label: 'Off Route', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
    arrived: { icon: '📍', label: 'Arrived', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' },
};

function getConfig(type) {
    return NOTIFICATION_CONFIG[type] || { icon: '🔔', label: type, color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', borderColor: 'rgba(107,114,128,0.3)' };
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'sos'

    const loadNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        // Auto-refresh every 5 seconds
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'sos') return n.type === 'sos';
        return true;
    });

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Notifications 🔔</h2>
                <p>Real-time alerts from your child's watch</p>
            </div>

            {/* Stats Bar */}
            <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card stat-card">
                    <div className="stat-icon blue">🔔</div>
                    <div className="stat-info">
                        <h3>{notifications.length}</h3>
                        <p>Total</p>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon orange">📩</div>
                    <div className="stat-info">
                        <h3>{unreadCount}</h3>
                        <p>Unread</p>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>🚨</div>
                    <div className="stat-info">
                        <h3>{notifications.filter(n => n.type === 'sos').length}</h3>
                        <p>SOS Alerts</p>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-info">
                        <h3>{notifications.filter(n => n.type === 'navigation_complete').length}</h3>
                        <p>Safe Arrivals</p>
                    </div>
                </div>
            </div>

            {/* Filter + Actions Bar */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['all', 'unread', 'sos'].map(f => (
                        <button
                            key={f}
                            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '📋 All' : f === 'unread' ? '📩 Unread' : '🚨 SOS Only'}
                        </button>
                    ))}
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-sm btn-outline" onClick={markAllRead}>
                        ✓ Mark All Read
                    </button>
                )}
            </div>

            {/* Auto-refresh indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }}></div>
                Live updates — refreshing every 5 seconds
            </div>

            {/* Notifications Feed */}
            {filteredNotifications.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">🔕</div>
                    <h3>{filter === 'all' ? 'No notifications yet' : filter === 'unread' ? 'All caught up!' : 'No SOS alerts'}</h3>
                    <p>{filter === 'all' ? 'Notifications will appear here when your child uses their watch.' : filter === 'unread' ? 'You\'ve read all your notifications.' : 'No SOS alerts have been triggered.'}</p>
                </div>
            ) : (
                <div className="notifications-feed">
                    {filteredNotifications.map(notif => {
                        const config = getConfig(notif.type);
                        return (
                            <div
                                key={notif.id}
                                className={`notification-card ${!notif.is_read ? 'unread' : ''} ${notif.type === 'sos' ? 'sos-alert' : ''}`}
                                style={{
                                    background: notif.is_read ? 'var(--bg-glass)' : config.bgColor,
                                    borderLeft: `4px solid ${config.color}`,
                                    borderColor: notif.is_read ? 'var(--border-glass)' : config.borderColor,
                                }}
                            >
                                <div className="notification-card-content">
                                    <div className="notification-icon" style={{ color: config.color, fontSize: '1.8rem' }}>
                                        {config.icon}
                                    </div>
                                    <div className="notification-body">
                                        <div className="notification-header">
                                            <span className="notification-type" style={{ color: config.color }}>{config.label}</span>
                                            <span className="notification-time">{timeAgo(notif.created_at)}</span>
                                        </div>
                                        <p className="notification-message">{notif.message}</p>
                                        <div className="notification-meta">
                                            <span>{notif.child_avatar} {notif.child_name}</span>
                                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                                        </div>
                                        {notif.latitude && notif.longitude && (
                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                    📍 {notif.latitude.toFixed(5)}, {notif.longitude.toFixed(5)}
                                                </span>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/tracking?child=${notif.child_id}`);
                                                    }}
                                                >
                                                    📍 Track Location
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {!notif.is_read && (
                                        <button
                                            className="notification-read-btn"
                                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                            title="Mark as read"
                                        >
                                            ✓
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

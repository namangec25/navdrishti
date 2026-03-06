// ============================================================
// NavDrishti - Route Editor Page
// ============================================================
// Interactive map-based route creator with waypoint editor.
// Click map to add waypoints. Each waypoint supports voice
// recording, image upload, and text instructions.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import api from '../api';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function RouteEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const polylineRef = useRef(null);

    const [routeName, setRouteName] = useState('');
    const [waypoints, setWaypoints] = useState([]);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!id);

    // Initialize map
    useEffect(() => {
        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current).setView([28.6139, 77.2090], 14); // Default: New Delhi

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setWaypoints(prev => [
                ...prev,
                {
                    latitude: lat,
                    longitude: lng,
                    instruction_text: '',
                    image_url: null,
                    voice_url: null,
                    step_number: prev.length + 1,
                    _voiceBlob: null,
                }
            ]);
        });

        mapInstanceRef.current = map;

        // Try to get user's location
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                map.setView([pos.coords.latitude, pos.coords.longitude], 15);
            },
            () => { } // Silently fail
        );

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Load children
    useEffect(() => {
        api.get('/children').then(res => {
            setChildren(res.data.children || []);
        }).catch(() => { });
    }, []);

    // Load existing route if editing
    useEffect(() => {
        if (id) {
            api.get(`/routes/${id}`).then(res => {
                const route = res.data.route;
                setRouteName(route.route_name);
                setSelectedChild(route.child_id || '');
                setWaypoints(route.waypoints || []);
                setLoading(false);

                // Fit map to waypoints
                if (route.waypoints?.length > 0 && mapInstanceRef.current) {
                    const bounds = L.latLngBounds(
                        route.waypoints.map(wp => [wp.latitude, wp.longitude])
                    );
                    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
            }).catch(() => {
                setLoading(false);
            });
        }
    }, [id]);

    // Update markers when waypoints change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        if (polylineRef.current) {
            polylineRef.current.remove();
        }

        // Add new markers
        const latlngs = [];
        waypoints.forEach((wp, i) => {
            const marker = L.marker([wp.latitude, wp.longitude], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
            width: 30px; height: 30px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 700; font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${i + 1}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                })
            }).addTo(map);

            marker.bindPopup(`<b>Step ${i + 1}</b><br>${wp.instruction_text || 'No instruction'}`);
            markersRef.current.push(marker);
            latlngs.push([wp.latitude, wp.longitude]);
        });

        // Draw polyline connecting waypoints
        if (latlngs.length > 1) {
            polylineRef.current = L.polyline(latlngs, {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10',
            }).addTo(map);
        }
    }, [waypoints]);

    // Update waypoint instruction text
    const updateWaypoint = (index, field, value) => {
        setWaypoints(prev => prev.map((wp, i) =>
            i === index ? { ...wp, [field]: value } : wp
        ));
    };

    // Remove waypoint
    const removeWaypoint = (index) => {
        setWaypoints(prev =>
            prev.filter((_, i) => i !== index)
                .map((wp, i) => ({ ...wp, step_number: i + 1 }))
        );
    };

    // Voice recording
    const startRecording = async (index) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunks, { type: 'audio/webm' });

                // Upload the voice recording
                const formData = new FormData();
                formData.append('voice', blob, 'recording.webm');
                try {
                    const res = await api.post('/upload/voice', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    updateWaypoint(index, 'voice_url', res.data.url);
                } catch (err) {
                    console.error('Voice upload failed:', err);
                }

                updateWaypoint(index, '_voiceBlob', URL.createObjectURL(blob));
                updateWaypoint(index, '_recording', false);
            };

            mediaRecorder.start();
            updateWaypoint(index, '_recording', true);
            updateWaypoint(index, '_recorder', mediaRecorder);

            // Auto-stop after 15 seconds
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 15000);
        } catch (err) {
            alert('Microphone access denied. Please allow microphone to record voice instructions.');
        }
    };

    const stopRecording = (index) => {
        const wp = waypoints[index];
        if (wp._recorder && wp._recorder.state === 'recording') {
            wp._recorder.stop();
        }
    };

    // Image upload
    const handleImageUpload = async (index, file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateWaypoint(index, 'image_url', res.data.url);
        } catch (err) {
            console.error('Image upload failed:', err);
        }
    };

    // Save route
    const handleSave = async () => {
        if (!routeName.trim()) {
            alert('Please enter a route name');
            return;
        }
        if (waypoints.length < 2) {
            alert('Please add at least 2 waypoints');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                route_name: routeName,
                child_id: selectedChild || null,
                waypoints: waypoints.map(({ _voiceBlob, _recording, _recorder, ...wp }) => wp),
            };

            if (id) {
                await api.put(`/routes/${id}`, payload);
            } else {
                await api.post('/routes', payload);
            }
            navigate('/routes');
        } catch (err) {
            alert('Failed to save route. Please try again.');
        } finally {
            setSaving(false);
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
                        <h2>{id ? 'Edit Route' : 'Create New Route'} 🗺️</h2>
                        <p>Click on the map to add waypoints. Add instructions for each step.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/routes')}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳ Saving...' : '💾 Save Route'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Route Name & Child Selection */}
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Route Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., School Route, Park Walk"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Assign to Child (optional)</label>
                        <select
                            className="input-field"
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                        >
                            <option value="">Select child...</option>
                            {children.map(c => (
                                <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Map + Waypoint Editor */}
            <div className="route-editor">
                {/* Map */}
                <div>
                    <div ref={mapRef} className="map-container" style={{ height: '500px' }}></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '0.5rem' }}>
                        💡 Click anywhere on the map to add a waypoint
                    </p>
                </div>

                {/* Waypoint Panel */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 600 }}>Waypoints ({waypoints.length})</h3>
                    </div>

                    {waypoints.length === 0 ? (
                        <div className="glass-card empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">📌</div>
                            <h3>No waypoints</h3>
                            <p>Click on the map to add waypoints</p>
                        </div>
                    ) : (
                        <div className="waypoint-panel">
                            {waypoints.map((wp, index) => (
                                <div key={index} className="waypoint-item">
                                    <div className="waypoint-number">{index + 1}</div>
                                    <div className="glass-card waypoint-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                📍 {wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => removeWaypoint(index)}
                                                style={{ padding: '0.25rem 0.5rem' }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <textarea
                                            className="input-field"
                                            placeholder="Voice instruction text (e.g., Turn left at the big tree)"
                                            value={wp.instruction_text || ''}
                                            onChange={(e) => updateWaypoint(index, 'instruction_text', e.target.value)}
                                            style={{ marginBottom: '0.5rem' }}
                                        />

                                        <div className="waypoint-actions">
                                            {/* Voice Recording */}
                                            <div className="voice-recorder">
                                                {wp._recording ? (
                                                    <button
                                                        className="record-btn recording"
                                                        onClick={() => stopRecording(index)}
                                                        title="Stop recording"
                                                    >
                                                        ⏹
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="record-btn idle"
                                                        onClick={() => startRecording(index)}
                                                        title="Record voice"
                                                    >
                                                        🎤
                                                    </button>
                                                )}
                                                {(wp._voiceBlob || wp.voice_url) && (
                                                    <div className="audio-preview">
                                                        <audio
                                                            controls
                                                            src={wp._voiceBlob || wp.voice_url}
                                                            style={{ width: '100%', height: '32px' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Image Upload */}
                                            <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer' }}>
                                                📷 Photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) handleImageUpload(index, e.target.files[0]);
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {/* Image Preview */}
                                        {wp.image_url && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <img
                                                    src={wp.image_url}
                                                    alt={`Step ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--border-glass)'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

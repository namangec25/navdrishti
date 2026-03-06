// ============================================================
// NavDrishti - Live Tracking Page
// ============================================================
// Shows a map with the child's latest position and route with
// geofence radius visualization. Simulates location updates.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import api from '../api';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LiveTracking() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const childMarkerRef = useRef(null);

    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    const [routes, setRoutes] = useState([]);
    const [trackingActive, setTrackingActive] = useState(false);
    const [lastLocation, setLastLocation] = useState(null);

    // Initialize map
    useEffect(() => {
        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current).setView([28.6139, 77.2090], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

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

    // Load routes when child is selected
    useEffect(() => {
        if (selectedChild) {
            api.get('/routes').then(res => {
                const childRoutes = (res.data.routes || []).filter(
                    r => r.child_id === parseInt(selectedChild)
                );
                setRoutes(childRoutes);
            });
        }
    }, [selectedChild]);

    // Simulate tracking (in a real app, this would poll the location API)
    useEffect(() => {
        if (!trackingActive || !selectedChild) return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/location/latest/${selectedChild}`);
                const loc = res.data.location;
                setLastLocation(loc);

                if (mapInstanceRef.current && loc) {
                    const latlng = [loc.latitude, loc.longitude];

                    if (childMarkerRef.current) {
                        childMarkerRef.current.setLatLng(latlng);
                    } else {
                        childMarkerRef.current = L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'child-tracking-marker',
                                html: `<div style="
                  width: 24px; height: 24px;
                  background: #10b981;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 15px rgba(16,185,129,0.5);
                  animation: pulse 2s ease-in-out infinite;
                "></div>`,
                                iconSize: [24, 24],
                                iconAnchor: [12, 12],
                            })
                        }).addTo(mapInstanceRef.current);
                    }

                    mapInstanceRef.current.setView(latlng, 16);
                }
            } catch {
                // No location data yet
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [trackingActive, selectedChild]);

    // Simulate sending a location (for demo purposes)
    const simulateLocation = async () => {
        if (!selectedChild) return;

        // Get map center as simulated location
        const center = mapInstanceRef.current.getCenter();
        const jitter = () => (Math.random() - 0.5) * 0.002;

        try {
            await api.post('/location/log', {
                child_id: parseInt(selectedChild),
                latitude: center.lat + jitter(),
                longitude: center.lng + jitter(),
            });
        } catch (err) {
            console.error('Simulate location failed:', err);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Live Tracking 📍</h2>
                <p>Track your child's location in real-time</p>
            </div>

            {/* Controls */}
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ minWidth: '200px' }}>
                        <label>Select Child</label>
                        <select
                            className="input-field"
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                        >
                            <option value="">Choose a child...</option>
                            {children.map(c => (
                                <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className={`btn ${trackingActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => setTrackingActive(!trackingActive)}
                        disabled={!selectedChild}
                    >
                        {trackingActive ? '⏹ Stop Tracking' : '▶️ Start Tracking'}
                    </button>

                    <button
                        className="btn btn-outline"
                        onClick={simulateLocation}
                        disabled={!selectedChild}
                    >
                        📡 Simulate Location
                    </button>
                </div>

                {trackingActive && (
                    <div className="tracking-status online" style={{ marginTop: '1rem', width: 'fit-content' }}>
                        <div className="pulse-dot green"></div>
                        Tracking active — updating every 3 seconds
                    </div>
                )}

                {lastLocation && (
                    <div style={{ marginTop: '0.75rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Last seen: {lastLocation.latitude.toFixed(5)}, {lastLocation.longitude.toFixed(5)}
                        {' '} at {new Date(lastLocation.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Map */}
            <div ref={mapRef} className="map-container" style={{ height: '500px' }}></div>
        </div>
    );
}

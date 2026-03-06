// ============================================================
// NavDrishti Guardian App - Root Component
// ============================================================
// Sets up React Router with auth-guarded routes and provides
// user authentication state throughout the app.
// ============================================================

import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import RouteEditor from './pages/RouteEditor';
import RoutesPage from './pages/RoutesPage';
import LiveTracking from './pages/LiveTracking';
import ChildrenPage from './pages/ChildrenPage';

// ---- Auth Context ----
export const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved auth on mount
        const token = localStorage.getItem('navdrishti_token');
        const savedUser = localStorage.getItem('navdrishti_user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('navdrishti_token', token);
        localStorage.setItem('navdrishti_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('navdrishti_token');
        localStorage.removeItem('navdrishti_user');
        setUser(null);
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                    <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                    <Route path="/" element={user ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="/routes" element={user ? <AppLayout><RoutesPage /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="/routes/new" element={user ? <AppLayout><RouteEditor /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="/routes/:id" element={user ? <AppLayout><RouteEditor /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="/tracking" element={user ? <AppLayout><LiveTracking /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="/children" element={user ? <AppLayout><ChildrenPage /></AppLayout> : <Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

// ---- App Layout with Sidebar ----
function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/routes', label: 'Routes', icon: '🗺️' },
        { path: '/children', label: 'Children', icon: '👧' },
        { path: '/tracking', label: 'Live Tracking', icon: '📍' },
    ];

    const WATCH_URL = 'http://localhost:3001/watch';

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">🧭</div>
                    <h1>NavDrishti</h1>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    {/* Cross-link to Watch App */}
                    <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '1rem', paddingTop: '0.75rem' }}>
                        <a
                            href={WATCH_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-link"
                            style={{ color: 'var(--accent-green-light)' }}
                        >
                            <span className="nav-icon">⌚</span>
                            Watch Preview
                        </a>
                    </div>
                </nav>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: 'auto' }}>
                    <div style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{user?.name}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                    <button className="nav-link" onClick={logout} style={{ color: 'var(--accent-red-light)' }}>
                        <span className="nav-icon">🚪</span>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

export default App;

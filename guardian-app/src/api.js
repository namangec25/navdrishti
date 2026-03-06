// ============================================================
// NavDrishti Guardian App - API Helper
// ============================================================
// Axios wrapper that auto-attaches the JWT token from
// localStorage to every request.
// ============================================================

import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('navdrishti_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('navdrishti_token');
            localStorage.removeItem('navdrishti_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

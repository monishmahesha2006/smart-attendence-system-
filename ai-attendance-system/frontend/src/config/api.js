// Dynamic API base URL configuration
// In production (e.g. Railway) or when served by backend, relative URLs ("") are used.
// If VITE_API_URL is explicitly set, it takes priority.
// When running locally in standalone Vite dev server (e.g. port 5173), fallback to http://localhost:8000.

const getApiBase = () => {
    if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '') {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
        const isLocalDevPort = window.location.port === '5173' || window.location.port === '3000';
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalHost && isLocalDevPort) {
            return 'http://localhost:8000';
        }
    }
    return '';
};

export const API = getApiBase();
export default API;

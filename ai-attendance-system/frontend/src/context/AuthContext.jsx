import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const saved = localStorage.getItem('user');
        if (token && saved) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(JSON.parse(saved));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = (token, name, role, department_id = null) => {
        const u = { name, role, department_id };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(u));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(u);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading…</div>;
    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

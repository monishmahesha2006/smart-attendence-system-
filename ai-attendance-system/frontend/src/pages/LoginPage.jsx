import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, GraduationCap, Building2, Loader2, BrainCircuit, Eye, EyeOff } from 'lucide-react';
import { API } from '../config/api';

const ROLES = [
    { key: 'super_admin', label: 'Super Admin', icon: ShieldCheck, color: '#3b82f6', desc: 'Full college access' },
    { key: 'dept_admin', label: 'Dept Admin', icon: Building2, color: '#10b981', desc: 'Department access' },
    { key: 'teacher', label: 'Teacher', icon: GraduationCap, color: '#8b5cf6', desc: 'Subject access' },
];

const HINTS = {
    super_admin: { email: 'admin@college.edu', pw: 'Admin@123' },
    dept_admin: { email: 'admin.cse@college.edu', pw: 'Admin@123' },
    teacher: { email: 'teacher.cse201@college.edu', pw: 'Teacher@123' },
};

const REDIRECTS = {
    super_admin: '/dashboard',
    dept_admin: '/dept-dashboard',
    teacher: '/teacher-dashboard',
};

export default function LoginPage() {
    const [role, setRole] = useState('super_admin');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const form = new URLSearchParams();
            form.append('username', email);
            form.append('password', pw);
            const res = await axios.post(`${API}/auth/login`, form, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            login(res.data.access_token, res.data.name, res.data.role, res.data.department_id ?? null);
            navigate(REDIRECTS[res.data.role] || '/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally { setLoading(false); }
    };

    const activeRole = ROLES.find(r => r.key === role);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 60%), var(--bg-void)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', position: 'relative', overflow: 'hidden',
        }}>
            {}
            <div className="bg-orbs" />

            {}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
                animation: 'pageFadeIn 0.5s ease forwards',
            }}>
                {}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 64, height: 64,
                        background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))',
                        borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: 'var(--glow-blue)',
                    }}>
                        <BrainCircuit size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
                        className="glow-text-blue">
                        AI Attend
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
                        Engineering College Smart Attendance
                    </p>
                </div>

                {}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    {}
                    <div role="tablist" aria-label="Select User Role" style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)' }}>
                        {ROLES.map(r => {
                            const Icon = r.icon;
                            const active = r.key === role;
                            return (
                                <button key={r.key}
                                    role="tab"
                                    aria-selected={active}
                                    id={`tab-${r.key}`}
                                    aria-label={`Select ${r.label} role`}
                                    onClick={() => { setRole(r.key); setEmail(''); setPw(''); setError(''); }}
                                    style={{
                                        flex: 1, padding: '1rem 0.5rem',
                                        background: active ? `${r.color}15` : 'transparent',
                                        border: 'none', cursor: 'pointer',
                                        borderBottom: active ? `2px solid ${r.color}` : '2px solid transparent',
                                        transition: 'all 0.2s',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    }}>
                                    <Icon size={18} color={active ? r.color : 'var(--text-muted)'} aria-hidden="true" />
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700,
                                        letterSpacing: '0.05em', textTransform: 'uppercase',
                                        color: active ? r.color : 'var(--text-muted)',
                                    }}>{r.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {}
                    <form id="login-form-panel" role="tabpanel" aria-labelledby={`tab-${role}`} onSubmit={handleLogin} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.6rem 1rem',
                            background: `${activeRole?.color}10`,
                            border: `1px solid ${activeRole?.color}30`,
                            borderRadius: '0.65rem',
                        }}>
                            <span style={{ fontSize: '0.8rem', color: activeRole?.color, fontWeight: 600 }}>
                                {activeRole?.desc}
                            </span>
                            <button type="button"
                                aria-label="Fill demo credentials"
                                onClick={() => { setEmail(HINTS[role].email); setPw(HINTS[role].pw); }}
                                style={{
                                    fontSize: '0.7rem', fontWeight: 700, color: activeRole?.color,
                                    background: `${activeRole?.color}20`, border: 'none', borderRadius: 6,
                                    padding: '0.25rem 0.65rem', cursor: 'pointer', letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}>
                                Demo Fill
                            </button>
                        </div>

                        {error && (
                            <div role="alert" aria-live="assertive" style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                color: 'var(--neon-rose)', padding: '0.75rem 1rem',
                                borderRadius: '0.6rem', fontSize: '0.85rem', textAlign: 'center',
                            }}>{error}</div>
                        )}

                        <div>
                            <label htmlFor="login-email-input" className="label">Email Address</label>
                            <input
                                id="login-email-input"
                                type="email"
                                name="email"
                                autoComplete="email"
                                required
                                aria-required="true"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={HINTS[role].email}
                                className="input"
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password-input" className="label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password-input"
                                    type={showPw ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    aria-required="true"
                                    value={pw}
                                    onChange={e => setPw(e.target.value)}
                                    placeholder="••••••••"
                                    className="input"
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                    onClick={() => setShowPw(v => !v)}
                                    style={{
                                        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                    }}>
                                    {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            aria-label="Sign In"
                            style={{ width: '100%', padding: '0.875rem' }}
                        >
                            {loading ? <Loader2 size={18} aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {loading ? 'Authenticating…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    AI Smart Attendance System · Engineering College Edition
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

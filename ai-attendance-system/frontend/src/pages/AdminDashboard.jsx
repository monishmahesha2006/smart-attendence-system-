import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Users, Building2, CalendarCheck, Camera, AlertTriangle,
    GraduationCap, BrainCircuit, BarChart3, RefreshCw, Layers
} from 'lucide-react';
import { API } from '../config/api';

function AnimatedNumber({ value = 0 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) return;
        let cur = 0;
        const step = Math.max(1, Math.ceil(value / 30));
        const id = setInterval(() => {
            cur = Math.min(cur + step, value);
            setDisplay(cur);
            if (cur >= value) clearInterval(id);
        }, 20);
        return () => clearInterval(id);
    }, [value]);
    return <span>{display.toLocaleString()}</span>;
}

function KPICard({ icon: Icon, label, value = 0, sub, color }) {
    return (
        <motion.div
            className="kpi-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderTop: `2px solid ${color}` }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8
                    }}>{label}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                        <AnimatedNumber value={value} />
                    </p>
                    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</p>}
                </div>
                <div style={{
                    padding: '0.75rem', borderRadius: '0.75rem',
                    background: `${color}18`, border: `1px solid ${color}35`,
                }}>
                    {Icon && <Icon size={22} color={color} />}
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('token');
            const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const [s, d] = await Promise.all([
                axios.get(`${API}/analytics/college-stats`, cfg),
                axios.get(`${API}/analytics/department-comparison`, cfg),
            ]);
            setStats(s.data || {});
            setDepts(Array.isArray(d.data) ? d.data : []);
        } catch (e) {
            setError('Failed to load stats. Ensure you are logged in.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const total = (stats?.today_present || 0) + (stats?.today_absent || 0);
    const presentPct = total > 0 ? Math.round((stats.today_present / total) * 100) : 0;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid var(--border-dim)',
                borderTopColor: 'var(--neon-blue)',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading college data…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neon-rose)' }}>{error}</div>
    );

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">College Command Center</h1>
                        <p className="page-subtitle">
                            Real-time overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button className="btn btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={15} />Refresh
                    </button>
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                    <KPICard icon={Users} label="Total Students" value={stats?.total_students || 0} color="#3b82f6" sub="Enrolled college-wide" />
                    <KPICard icon={GraduationCap} label="Teachers" value={stats?.total_teachers || 0} color="#8b5cf6" sub="Active faculty" />
                    <KPICard icon={Building2} label="Departments" value={stats?.total_departments || 0} color="#06b6d4" sub="Active departments" />
                    <KPICard icon={Layers} label="Sections" value={stats?.total_sections || 0} color="#6366f1" sub="Across all depts" />
                    <KPICard icon={CalendarCheck} label="Present Today" value={stats?.today_present || 0} color="#10b981" sub={`${presentPct}% of total`} />
                    <KPICard icon={AlertTriangle} label="Absent Today" value={stats?.today_absent || 0} color="#f59e0b" sub="Across all periods" />
                    <KPICard icon={Camera} label="Cameras" value={stats?.total_cameras || 0} color="#ec4899" sub="Active classroom feeds" />
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>

                    {}
                    <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Today's Attendance
                        </p>
                        <div style={{ position: 'relative', display: 'inline-block', width: 150, height: 150 }}>
                            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="75" cy="75" r="58" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="12" />
                                <circle cx="75" cy="75" r="58" fill="none"
                                    stroke="url(#g1)" strokeWidth="12"
                                    strokeDasharray={`${presentPct * 3.644} 364.4`}
                                    strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentPct}%</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Present</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{stats?.today_present || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{stats?.today_absent || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
                            </div>
                        </div>
                    </div>

                    {/* Dept ranking */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Department Ranking</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Sorted by overall attendance %</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {depts.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No department data available</p>
                            )}
                            {[...depts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).map((d, i) => {
                                const pct = d.percentage || 0;
                                const color = pct >= 80 ? '#10b981' : pct >= 65 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={d.code || i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: 6 }}>#{i + 1}</span>
                                                {d.department}
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'Space Mono, monospace' }}>{d.code}</span>
                                            </span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}70)` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

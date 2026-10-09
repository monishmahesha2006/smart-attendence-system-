import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, CalendarCheck, AlertTriangle, TrendingUp,
    RefreshCw, Layers, ChevronDown, ChevronUp,
} from 'lucide-react';
import { API } from '../config/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function DeptAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [risk, setRisk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const [s, r] = await Promise.all([
                axios.get(`${API}/me/dashboard-stats`, cfg()),
                axios.get(`${API}/me/risk-list`, cfg()),
            ]);
            setStats(s.data);
            setRisk(r.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const presentPct = stats ? Math.round((stats.today_present / (stats.total_students || 1)) * 100) : 0;

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <h1 className="page-title">Department Dashboard</h1>
                        <p className="page-subtitle">Scoped to your department — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button className="btn btn-ghost" onClick={load}>
                        <RefreshCw size={15} className={loading ? 'spin' : ''} />Refresh
                    </button>
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Students', value: stats?.total_students || 0, icon: Users, color: '#3b82f6' },
                        { label: 'Sections', value: stats?.total_sections || 0, icon: Layers, color: '#8b5cf6' },
                        { label: 'Present', value: stats?.today_present || 0, icon: CalendarCheck, color: '#10b981' },
                        { label: 'Absent', value: stats?.today_absent || 0, icon: AlertTriangle, color: '#f59e0b' },
                        { label: 'At Risk', value: stats?.at_risk_count || 0, icon: AlertTriangle, color: '#ef4444' },
                    ].map((k, i) => (
                        <motion.div key={k.label} className="kpi-card"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            style={{ borderTop: `2px solid ${k.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{k.label}</p>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{k.value}</p>
                                </div>
                                <div style={{
                                    padding: '0.6rem', borderRadius: '0.65rem',
                                    background: `${k.color}15`, border: `1px solid ${k.color}30`,
                                }}>
                                    <k.icon size={18} color={k.color} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {}
                {stats?.trend && (
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>7-Day Attendance Trend</p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 100 }}>
                            {stats.trend.map((d, i) => {
                                const pct = d.pct || 0;
                                const color = pct >= 80 ? '#10b981' : pct >= 65 ? '#3b82f6' : '#f59e0b';
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{pct}%</span>
                                        <div style={{ width: '100%', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                                            <div style={{
                                                width: '100%', height: `${Math.max(pct, 3)}%`,
                                                background: `linear-gradient(180deg, ${color}, ${color}80)`,
                                                borderRadius: 4,
                                                transition: 'height 1s ease',
                                                boxShadow: `0 0 8px ${color}40`,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>At-Risk Students</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Students with attendance below 80% in your department</p>
                        </div>
                        <span className="badge badge-rose">{risk.length} students</span>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {risk.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                ✅ No at-risk students in your department
                            </p>
                        ) : risk.map((r, i) => (
                            <motion.div key={r.student_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.875rem 1.5rem',
                                    borderBottom: '1px solid rgba(56,105,177,0.06)',
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: `${r.color}20`, border: `1px solid ${r.color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.875rem', color: r.color,
                                        flexShrink: 0,
                                    }}>
                                        {r.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{r.student_name}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>{r.roll_no}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className={`badge ${r.level === 'DETAIN' ? 'badge-rose' : r.level === 'CRITICAL' ? 'badge-amber' : 'badge-amber'}`}>
                                        {r.level}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: r.color }}>{r.percentage}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}

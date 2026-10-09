import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    BookOpen, Users, CalendarCheck, AlertTriangle,
    RefreshCw, CheckCircle, TrendingUp
} from 'lucide-react';
import { API } from '../config/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function TeacherDashboard() {
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [risk, setRisk] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [s, sub, stu, r] = await Promise.all([
                axios.get(`${API}/me/dashboard-stats`, cfg()),
                axios.get(`${API}/me/subjects`, cfg()),
                axios.get(`${API}/me/students`, cfg()),
                axios.get(`${API}/me/risk-list`, cfg()),
            ]);
            setStats(s.data);
            setSubjects(sub.data);
            setStudents(stu.data);
            setRisk(r.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const presentPct = stats && stats.total_students > 0
        ? Math.round(stats.today_present / stats.total_students * 100)
        : 0;

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <h1 className="page-title">Teacher Dashboard</h1>
                        <p className="page-subtitle">Showing only your assigned subjects and students</p>
                    </div>
                    <button className="btn btn-ghost" onClick={load}>
                        <RefreshCw size={15} />Refresh
                    </button>
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'My Subjects', value: subjects.length, icon: BookOpen, color: '#8b5cf6' },
                        { label: 'My Students', value: stats?.total_students || 0, icon: Users, color: '#3b82f6' },
                        { label: 'Present', value: stats?.today_present || 0, icon: CalendarCheck, color: '#10b981' },
                        { label: 'Absent', value: stats?.today_absent || 0, icon: AlertTriangle, color: '#f59e0b' },
                        { label: 'At Risk', value: risk.length, icon: AlertTriangle, color: '#ef4444' },
                    ].map((k, i) => (
                        <motion.div key={k.label} className="kpi-card"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            style={{ borderTop: `2px solid ${k.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{k.label}</p>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{k.value}</p>
                                </div>
                                <div style={{ padding: '0.6rem', borderRadius: '0.65rem', background: `${k.color}15`, border: `1px solid ${k.color}30` }}>
                                    <k.icon size={18} color={k.color} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {}
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-dim)' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>My Subjects</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{subjects.length} assigned to you</p>
                        </div>
                        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                            {subjects.length === 0 ? (
                                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No subjects assigned</p>
                            ) : subjects.map((s, i) => (
                                <div key={s.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                                    padding: '0.75rem 1.5rem',
                                    borderBottom: '1px solid rgba(56,105,177,0.06)',
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '0.5rem',
                                        background: 'rgba(139,92,246,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700, color: '#8b5cf6',
                                        flexShrink: 0, fontFamily: 'Space Mono, monospace',
                                    }}>
                                        {s.code?.slice(0, 3) || 'SUB'}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.name}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>{s.code}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Today's Snapshot</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Across your sections</p>

                        {/* Arc */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                            <div style={{ position: 'relative', width: 110, height: 110 }}>
                                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="10" />
                                    <circle cx="55" cy="55" r="42" fill="none"
                                        stroke={presentPct >= 75 ? '#10b981' : presentPct >= 60 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="10"
                                        strokeDasharray={`${presentPct * 2.638} 263.8`}
                                        strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentPct}%</span>
                                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Present</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{stats?.today_present || 0}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Absent</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{stats?.today_absent || 0}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>At Risk</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>{risk.length}</span>
                                </div>
                            </div>
                        </div>

                        {risk.length > 0 && (
                            <div style={{
                                marginTop: '1.25rem', padding: '0.75rem',
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                borderRadius: '0.65rem',
                            }}>
                                <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    ⚠ {risk.length} student{risk.length !== 1 ? 's' : ''} need intervention
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {risk.slice(0, 4).map(r => (
                                        <span key={r.student_id} style={{
                                            fontSize: '0.65rem', fontWeight: 600,
                                            padding: '0.2rem 0.5rem', borderRadius: 4,
                                            background: `${r.color}20`, color: r.color,
                                        }}>
                                            {r.student_name} ({r.percentage}%)
                                        </span>
                                    ))}
                                    {risk.length > 4 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{risk.length - 4} more</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

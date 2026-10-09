import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { API } from '../config/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const RISK_COLORS = {
    DETAIN: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', badge: 'badge-rose' },
    CRITICAL: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', badge: 'badge-amber' },
    WARNING: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', text: '#eab308', badge: 'badge-amber' },
};

export default function AnalyticsPage() {
    const [trend, setTrend] = useState([]);
    const [risk, setRisk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('trend');

    const load = async () => {
        setLoading(true);
        try {
            const [t, r] = await Promise.all([
                axios.get(`${API}/me/monthly-trend`, cfg()),
                axios.get(`${API}/me/risk-list`, cfg()),
            ]);
            setTrend(t.data);
            setRisk(r.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const maxPct = Math.max(...trend.map(d => d.pct), 1);

    const detain = risk.filter(r => r.level === 'DETAIN');
    const critical = risk.filter(r => r.level === 'CRITICAL');
    const warning = risk.filter(r => r.level === 'WARNING');

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <h1 className="page-title">Analytics & Insights</h1>
                        <p className="page-subtitle">30-day trend · Risk escalation · Performance radar</p>
                    </div>
                    <button className="btn btn-ghost" onClick={load}>
                        <RefreshCw size={15} className={loading ? 'spin' : ''} />Refresh
                    </button>
                </div>

                {}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: 2 }}>
                    {[
                        { key: 'trend', label: '📈  30-Day Trend' },
                        { key: 'risk', label: `⚠️  Risk Ladder (${risk.length})` },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{
                                padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.875rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: tab === t.key ? '2px solid var(--neon-blue)' : '2px solid transparent',
                                color: tab === t.key ? 'var(--neon-blue)' : 'var(--text-secondary)',
                                transition: 'color 0.15s',
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {}
                {tab === 'trend' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="glass-card" style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Attendance % — Last 30 Days</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Scoped to your accessible data</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {[
                                        { color: '#10b981', label: '≥80%' },
                                        { color: '#3b82f6', label: '65–79%' },
                                        { color: '#f59e0b', label: '<65%' },
                                    ].map(l => (
                                        <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                                            {l.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {}
                            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 160, overflowX: 'auto' }}>
                                {trend.map((d, i) => {
                                    const pct = d.pct || 0;
                                    const color = pct >= 80 ? '#10b981' : pct >= 65 ? '#3b82f6' : '#f59e0b';
                                    const h = Math.max((pct / (maxPct || 100)) * 140, 4);
                                    const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 20 }}>
                                            <div style={{
                                                width: '70%', height: `${h}px`,
                                                background: `linear-gradient(180deg, ${color}, ${color}60)`,
                                                borderRadius: '4px 4px 0 0',
                                                boxShadow: `0 0 8px ${color}40`,
                                                transition: 'height 0.8s ease',
                                                position: 'relative',
                                            }} title={`${d.date}: ${pct}%`} />
                                            {i % 5 === 0 && (
                                                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', transform: 'rotate(-35deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
                                                    {dayLabel}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {}
                            {trend.length > 0 && (() => {
                                const avg = Math.round(trend.reduce((s, d) => s + (d.pct || 0), 0) / trend.length);
                                const color = avg >= 80 ? '#10b981' : avg >= 65 ? '#3b82f6' : '#f59e0b';
                                return (
                                    <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '0.65rem', background: `${color}10`, border: `1px solid ${color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>30-Day Average</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{avg}%</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {}
                {tab === 'risk' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { level: 'DETAIN', list: detain, icon: '🔴', desc: 'Below 65% — Eligible for detention. Immediate parental notification required.' },
                            { level: 'CRITICAL', list: critical, icon: '🟠', desc: 'Below 75% — Student is critical. Counseling recommended.' },
                            { level: 'WARNING', list: warning, icon: '🟡', desc: 'Below 80% — Approaching danger zone. Verbal reminder issued.' },
                        ].map(group => {
                            const c = RISK_COLORS[group.level];
                            return (
                                <div key={group.level} className="glass-card" style={{ overflow: 'hidden', border: `1px solid ${c.border}` }}>
                                    <div style={{ padding: '1rem 1.5rem', background: c.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.level}</span>
                                                <span className={`badge ${c.badge}`}>{group.list.length} students</span>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{group.desc}</p>
                                        </div>
                                    </div>
                                    {group.list.length === 0 ? (
                                        <p style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>✅ No students at this level</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', padding: '1rem' }}>
                                            {group.list.map(r => (
                                                <div key={r.student_id} style={{
                                                    padding: '0.875rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid var(--border-dim)',
                                                    borderRadius: '0.65rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: '50%',
                                                            background: `${c.text}20`, border: `1px solid ${c.text}40`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: '0.875rem', color: c.text,
                                                        }}>
                                                            {r.student_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.student_name}</p>
                                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>{r.roll_no}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontWeight: 700, fontSize: '1rem', color: c.text }}>{r.percentage}%</p>
                                                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{r.attended}/{r.total}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, RefreshCw, Trash2, KeyRound, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

function CredentialCard({ cred, onClose }) {
    const [copied, setCopied] = useState('');
    const copy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-glow)',
                    borderRadius: '1.25rem', padding: '2rem', maxWidth: 440, width: '100%',
                    boxShadow: 'var(--glow-emerald)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>✅ Teacher Account Created!</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            Password shown only once — copy and share securely
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {[
                    { label: 'Name', value: cred.name },
                    { label: 'Email', value: cred.email },
                    { label: 'Department', value: cred.department },
                    { label: 'Password', value: cred.plain_password, highlight: true },
                ].map(row => (
                    <div key={row.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.75rem 1rem', marginBottom: '0.5rem',
                        background: row.highlight ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${row.highlight ? 'rgba(16,185,129,0.3)' : 'var(--border-dim)'}`,
                        borderRadius: '0.65rem',
                    }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{row.label}</div>
                            <div style={{
                                fontSize: '0.95rem', fontWeight: 600,
                                color: row.highlight ? 'var(--neon-emerald)' : 'var(--text-primary)',
                                fontFamily: row.highlight ? 'Space Mono, monospace' : 'inherit',
                            }}>{row.value || '—'}</div>
                        </div>
                        {row.value && (
                            <button onClick={() => copy(row.value, row.label)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === row.label ? 'var(--neon-emerald)' : 'var(--text-muted)', padding: 4 }}>
                                {copied === row.label ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        )}
                    </div>
                ))}

                <button className="btn btn-emerald" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
                    Done — I've saved the credentials
                </button>
            </motion.div>
        </div>
    );
}

export default function TeacherManagement() {
    const { user } = useAuth();
    const role = user?.role || 'teacher';
    const [teachers, setTeachers] = useState([]);
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [cred, setCred] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', department_id: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [t, d] = await Promise.all([
                axios.get(`${API}/teachers/`, cfg()),
                axios.get(`${API}/departments/`),
            ]);
            setTeachers(t.data);
            setDepts(d.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const create = async () => {
        setSaving(true); setErr('');
        try {
            const payload = {
                name: form.name,
                email: form.email,
                department_id: role === 'super_admin' ? Number(form.department_id) : user?.department_id,
                password: form.password || undefined,
            };
            const res = await axios.post(`${API}/teachers/`, payload, cfg());
            setCred(res.data);
            setModal(false);
            setForm({ name: '', email: '', department_id: '', password: '' });
            load();
        } catch (e) {
            setErr(e.response?.data?.detail || 'Failed to create teacher');
        } finally { setSaving(false); }
    };

    const resetPw = async (id) => {
        try {
            const res = await axios.put(`${API}/teachers/${id}/reset-password`, {}, cfg());
            const t = teachers.find(t => t.id === id);
            setCred({ ...t, plain_password: res.data.plain_password });
        } catch { alert('Reset failed'); }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this teacher? Their subjects will become unassigned.')) return;
        try {
            await axios.delete(`${API}/teachers/${id}`, cfg());
            load();
        } catch { alert('Delete failed'); }
    };

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Teacher Management</h1>
                        <p className="page-subtitle">
                            {role === 'super_admin' ? 'All departments' : 'Your department only'} · {teachers.length} teachers
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-ghost" onClick={load}><RefreshCw size={15} /></button>
                        <button className="btn btn-emerald" onClick={() => setModal(true)}>
                            <UserPlus size={16} />Add Teacher
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {['Teacher', 'Email', 'Department', 'Subjects', 'Actions'].map(h => <th key={h}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</td></tr>
                                ) : teachers.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No teachers found</td></tr>
                                ) : teachers.map(t => (
                                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: '50%',
                                                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: '0.875rem', color: '#8b5cf6', flexShrink: 0,
                                                }}>{t.name?.charAt(0)?.toUpperCase()}</div>
                                                <span style={{ fontWeight: 600 }}>{t.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.email}</td>
                                        <td><span className="badge badge-purple">{t.department || '—'}</span></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.subject_count} subject{t.subject_count !== 1 ? 's' : ''}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button title="Reset Password" onClick={() => resetPw(t.id)} className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem' }}>
                                                    <KeyRound size={14} />
                                                </button>
                                                <button title="Delete Teacher" onClick={() => remove(t.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {modal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: '1.25rem', padding: '2rem', maxWidth: 480, width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Add New Teacher</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Leave password blank to auto-generate</p>
                                </div>
                                <button onClick={() => { setModal(false); setErr(''); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {err && <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.65rem', fontSize: '0.85rem', color: 'var(--neon-rose)' }}>{err}</div>}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Full Name', key: 'name', type: 'text', ph: 'Prof. Ananya Sharma' },
                                    { label: 'Email', key: 'email', type: 'email', ph: 'teacher.xyz@college.edu' },
                                    { label: 'Password', key: 'password', type: 'password', ph: 'Leave blank to auto-generate' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="label">{f.label}</label>
                                        <input type={f.type} placeholder={f.ph} value={form[f.key]} className="input"
                                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    </div>
                                ))}

                                {role === 'super_admin' && (
                                    <div>
                                        <label className="label">Department</label>
                                        <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))} className="input">
                                            <option value="">Select department…</option>
                                            {depts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                        </select>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setModal(false); setErr(''); }}>Cancel</button>
                                    <button className="btn btn-emerald" style={{ flex: 2 }} disabled={saving} onClick={create}>
                                        {saving ? 'Creating…' : <><UserPlus size={15} />Create & Get Credentials</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {cred && <CredentialCard cred={cred} onClose={() => setCred(null)} />}
        </div>
    );
}

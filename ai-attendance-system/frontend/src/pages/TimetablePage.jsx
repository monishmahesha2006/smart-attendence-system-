import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Clock, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function TimetablePage() {
    const { user } = useAuth();
    const role = user?.role || 'teacher';
    const deptId = user?.department_id || null;

    const [slots, setSlots] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selSection, setSelSection] = useState('');
    const [selDay, setSelDay] = useState(
        new Date().getDay() === 0 ? 0 : new Date().getDay() - 1
    );
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        section_id: '', subject_id: '', day_of_week: 0,
        period_no: 1, start_time: '08:00', end_time: '09:00',
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    
    useEffect(() => {
        const secUrl = role === 'dept_admin' && deptId
            ? `${API}/sections/?dept_id=${deptId}`
            : `${API}/sections/`;

        const subUrl = role === 'dept_admin' && deptId
            ? `${API}/subjects/?dept_id=${deptId}`
            : `${API}/subjects/`;

        Promise.all([
            axios.get(secUrl),
            axios.get(subUrl),
        ]).then(([s, sub]) => {
            setSections(s.data);
            setSubjects(sub.data);
        }).catch(() => { });
    }, [role, deptId]);

    
    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selSection) params.append('section_id', selSection);
            params.append('day', selDay);
            const res = await axios.get(`${API}/timetable/?${params}`, cfg());
            setSlots(res.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [selSection, selDay]);

    
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/timetable/`, {
                ...form,
                section_id: Number(form.section_id),
                subject_id: Number(form.subject_id),
                day_of_week: Number(form.day_of_week),
                period_no: Number(form.period_no),
            }, cfg());
            setShowForm(false);
            load();
            showToast('✅ Period slot added!');
        } catch (err) {
            showToast('❌ ' + (err.response?.data?.detail || 'Failed to save slot'));
        }
    };

    
    const deleteSlot = async (id) => {
        try {
            await axios.delete(`${API}/timetable/${id}`, cfg());
            load();
            showToast('🗑️ Slot removed.');
        } catch { showToast('❌ Delete failed'); }
    };

    
    const subjectName = (id) => subjects.find(s => s.id === id)?.name ?? `Subject #${id}`;
    const subjectCode = (id) => subjects.find(s => s.id === id)?.code ?? '';
    const sectionName = (id) => sections.find(s => s.id === id)?.name ?? `Section #${id}`;

    
    const grouped = useMemo(() => {
        const map = {};
        slots.forEach(slot => {
            const key = `${slot.section_id}-${slot.period_no}`;
            if (!map[key]) map[key] = slot;
        });
        return Object.values(map).sort((a, b) => a.period_no - b.period_no);
    }, [slots]);

    const dayColor = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {}
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
                            className="toast">{toast}</motion.div>
                    )}
                </AnimatePresence>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Timetable Manager</h1>
                        <p className="page-subtitle">
                            {role === 'dept_admin'
                                ? `📌 Showing only your department's timetable`
                                : role === 'teacher'
                                    ? '📌 Showing timetable for your assigned sections'
                                    : 'Configure period slots for each section and day'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={load} className="btn btn-ghost">
                            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                        </button>
                        {role !== 'teacher' && (
                            <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
                                <Plus size={16} />Add Period Slot
                            </button>
                        )}
                    </div>
                </div>

                {}
                {role === 'dept_admin' && (
                    <div style={{
                        padding: '0.65rem 1rem', borderRadius: '0.65rem',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: '0.8rem', color: 'var(--neon-emerald)', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Layers size={14} />
                        You are viewing timetable only for your department's sections ({sections.map(s => s.name).join(', ') || 'loading…'})
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Section filter */}
                    <select value={selSection} onChange={e => setSelSection(e.target.value)}
                        className="input" style={{ maxWidth: 220 }}>
                        <option value="">All Sections{role === 'dept_admin' ? ' (Dept)' : ''}</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    {/* Day tabs */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {DAYS.map((d, i) => (
                            <button key={d} onClick={() => setSelDay(i)}
                                style={{
                                    padding: '0.45rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                                    fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                    background: selDay === i ? dayColor[i] : 'rgba(255,255,255,0.04)',
                                    color: selDay === i ? 'white' : 'var(--text-secondary)',
                                    boxShadow: selDay === i ? `0 4px 12px ${dayColor[i]}40` : 'none',
                                }}>
                                {d.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleCreate} className="glass-card" style={{ overflow: 'hidden', padding: '1.5rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>New Period Slot</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="label">Section</label>
                                    <select required value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })} className="input">
                                        <option value="">Select Section…</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Subject</label>
                                    <select required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input">
                                        <option value="">Select Subject…</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Day</label>
                                    <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: +e.target.value })} className="input">
                                        {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Period No.</label>
                                    <select value={form.period_no} onChange={e => setForm({ ...form, period_no: +e.target.value })} className="input">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Period {n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Start Time</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="label">End Time</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-primary">Save Slot</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Slot cards */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px dashed var(--border-dim)', borderTopColor: 'var(--neon-blue)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Loading timetable…</span>
                    </div>
                ) : slots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <Clock size={40} style={{ marginBottom: 12, opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ fontWeight: 600 }}>No period slots for {DAYS[selDay]}{selSection ? ` in this section` : ''}</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
                        {slots.map(slot => (
                            <motion.div key={slot.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="glass-card" style={{ padding: '1.125rem', borderLeft: `3px solid ${dayColor[selDay]}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: `${dayColor[selDay]}22`, border: `1px solid ${dayColor[selDay]}44`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.7rem', color: dayColor[selDay],
                                        }}>P{slot.period_no}</div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>
                                            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                        </span>
                                    </div>
                                    {role !== 'teacher' && (
                                        <button onClick={() => deleteSlot(slot.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {subjectName(slot.subject_id)}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{subjectCode(slot.subject_id)}</span>
                                    <span className="badge badge-purple" style={{ fontSize: '0.6rem' }}>{sectionName(slot.section_id)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

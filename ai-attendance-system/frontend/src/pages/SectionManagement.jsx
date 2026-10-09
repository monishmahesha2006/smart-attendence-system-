import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, RefreshCw, LayoutGrid, Users, X,
    BookOpen, GraduationCap, Clock, ChevronRight,
    Building2, CalendarDays, Layers,
} from 'lucide-react';

const API = 'http://localhost:8000';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const DAY_MAP = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 };

function SectionDrawer({ sectionId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setTab] = useState('overview');

    useEffect(() => {
        if (!sectionId) return;
        setLoading(true);
        axios.get(`${API}/sections/${sectionId}/detail`)
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [sectionId]);

    
    const timetableByDay = {};
    (data?.timetable || []).forEach(slot => {
        if (!timetableByDay[slot.day]) timetableByDay[slot.day] = [];
        timetableByDay[slot.day].push(slot);
    });

    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'students', label: `Students (${data?.student_count ?? '…'})` },
        { key: 'teachers', label: `Teachers (${data?.teachers?.length ?? '…'})` },
        { key: 'timetable', label: 'Timetable' },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', justifyContent: 'flex-end',
        }} onClick={onClose}>
            <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: 500, height: '100vh', overflowY: 'auto',
                    background: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border-glow)',
                    boxShadow: 'var(--glow-blue)',
                    display: 'flex', flexDirection: 'column',
                }}>

                {}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '0.85rem',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.2))',
                            border: '1px solid rgba(99,102,241,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Layers size={20} color="#6366f1" />
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {loading ? 'Loading…' : data?.name || 'Section'}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {data ? `${data.department} · Year ${data.year}` : 'Section Details'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-dim)', borderTopColor: 'var(--neon-blue)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading section data…</span>
                    </div>
                ) : !data ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load section details.</p>
                ) : (
                    <>
                        {}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', overflowX: 'auto' }}>
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    style={{
                                        padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.75rem',
                                        background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                        borderBottom: activeTab === t.key ? '2px solid var(--neon-blue)' : '2px solid transparent',
                                        color: activeTab === t.key ? 'var(--neon-blue)' : 'var(--text-secondary)',
                                    }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {}
                            {activeTab === 'overview' && (
                                <>
                                    {}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {[
                                            { label: 'Department', value: data.department, icon: Building2, color: '#3b82f6' },
                                            { label: 'Year', value: `Year ${data.year}`, icon: CalendarDays, color: '#8b5cf6' },
                                            { label: 'Students', value: data.student_count, icon: Users, color: '#10b981' },
                                            { label: 'Subjects', value: data.subjects.length, icon: BookOpen, color: '#06b6d4' },
                                            { label: 'Teachers', value: data.teachers.length, icon: GraduationCap, color: '#f59e0b' },
                                            { label: 'Timetable', value: `${data.timetable.length} slots`, icon: Clock, color: '#6366f1' },
                                        ].map(k => (
                                            <div key={k.label} style={{
                                                padding: '1rem', borderRadius: '0.75rem',
                                                background: `${k.color}0c`, border: `1px solid ${k.color}25`,
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            }}>
                                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: `${k.color}18` }}>
                                                    <k.icon size={16} color={k.color} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 2 }}>{k.label}</p>
                                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{k.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {}
                                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                                        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>📚 Subjects in this Section</p>
                                        </div>
                                        {data.subjects.length === 0 ? (
                                            <p style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subjects assigned.</p>
                                        ) : data.subjects.map(s => (
                                            <div key={s.id} style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{s.name}</p>
                                                    <p style={{ fontSize: '0.65rem', fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>{s.code}</p>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.teacher?.name || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {}
                            {activeTab === 'students' && (
                                <div className="glass-card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Enrolled Students</p>
                                    </div>
                                    {data.students.length === 0 ? (
                                        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students in this section.</p>
                                    ) : data.students.map(s => (
                                        <div key={s.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%',
                                                    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: '0.8rem', color: 'var(--neon-blue)', flexShrink: 0,
                                                }}>{s.student_name?.charAt(0)?.toUpperCase()}</div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{s.student_name}</p>
                                                    <p style={{ fontSize: '0.65rem', fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>{s.student_id}</p>
                                                </div>
                                            </div>
                                            <span className={`badge ${s.has_photos ? 'badge-emerald' : 'badge-amber'}`}>
                                                {s.has_photos ? '📸 Photos' : '⚠ No photos'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {}
                            {activeTab === 'teachers' && (
                                <div className="glass-card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Subject Teachers</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>All teachers handling subjects in {data.name}</p>
                                    </div>
                                    {data.teachers.length === 0 ? (
                                        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No teachers assigned yet.</p>
                                    ) : data.teachers.map(t => (
                                        <div key={t.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '0.875rem', color: '#8b5cf6', flexShrink: 0,
                                            }}>{t.name?.charAt(0)?.toUpperCase()}</div>
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.email}</p>
                                                {}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                                    {data.subjects.filter(s => s.teacher?.id === t.id).map(s => (
                                                        <span key={s.id} className="badge badge-purple" style={{ fontSize: '0.55rem' }}>{s.code}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {}
                            {activeTab === 'timetable' && (
                                data.timetable.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No timetable slots configured.</p>
                                ) : Object.entries(timetableByDay).map(([day, slots]) => (
                                    <div key={day} className="glass-card" style={{ overflow: 'hidden' }}>
                                        <div style={{ padding: '0.65rem 1.25rem', background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid var(--border-dim)' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--neon-blue)' }}>{day}</p>
                                        </div>
                                        {slots.map(slot => (
                                            <div key={slot.id} style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'grid', gridTemplateColumns: '70px 1fr auto', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                    P{slot.period_no}<br />
                                                    {slot.start_time}–{slot.end_time}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{slot.subject || '—'}</p>
                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{slot.teacher || 'Unassigned'}</p>
                                                </div>
                                                <span className="badge badge-blue" style={{ fontSize: '0.55rem' }}>{slot.subject_code}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </motion.div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function SectionManagement() {
    const [sections, setSections] = useState([]);
    const [depts, setDepts] = useState([]);
    const [students, setStudents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '', year: 2, department_id: '' });
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const [sec, dep, stu] = await Promise.all([
            axios.get(`${API}/sections/`),
            axios.get(`${API}/departments/`),
            axios.get(`${API}/students/`, cfg()),
        ]);
        setSections(sec.data); setDepts(dep.data); setStudents(stu.data);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        await axios.post(`${API}/sections/`, { ...form, department_id: Number(form.department_id) }, cfg());
        setShowForm(false); load();
    };
    const del = async (id) => {
        if (!window.confirm('Delete this section? Students inside will be unassigned.')) return;
        await axios.delete(`${API}/sections/${id}`, cfg());
        if (selectedId === id) setSelectedId(null);
        load();
    };

    const deptName = id => depts.find(d => d.id === id)?.name ?? '—';
    const deptCode = id => depts.find(d => d.id === id)?.code ?? '';
    const studentsInSec = id => students.filter(s => s.section_id === id).length;

    const YEAR_LABELS = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
    const YEAR_COLORS = { 1: '#3b82f6', 2: '#8b5cf6', 3: '#10b981', 4: '#f59e0b' };

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Section Management</h1>
                        <p className="page-subtitle">Click any section card to view full details · {sections.length} sections total</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-ghost" onClick={load}><RefreshCw size={15} /></button>
                        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                            <Plus size={16} />Add Section
                        </button>
                    </div>
                </div>

                {}
                <AnimatePresence>
                    {showForm && (
                        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            onSubmit={create} className="glass-card" style={{ overflow: 'hidden', padding: '1.5rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Create New Section</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div><label className="label">Section Name</label><input required placeholder="e.g. CSE-C" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
                                <div>
                                    <label className="label">Year</label>
                                    <select value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} className="input">
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Department</label>
                                    <select required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} className="input">
                                        <option value="">Select…</option>
                                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-primary">Create Section</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-dim)', borderTopColor: 'var(--neon-blue)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Loading sections…</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {sections.map(sec => {
                            const color = YEAR_COLORS[sec.year] || '#3b82f6';
                            const count = studentsInSec(sec.id);
                            return (
                                <motion.div key={sec.id}
                                    className="glass-card"
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -4, boxShadow: `0 0 20px ${color}25` }}
                                    style={{ padding: '1.25rem', cursor: 'pointer', borderTop: `2px solid ${color}`, position: 'relative' }}
                                    onClick={() => setSelectedId(sec.id)}>

                                    {}
                                    <button onClick={e => { e.stopPropagation(); del(sec.id); }}
                                        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                        <Trash2 size={14} />
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '0.75rem', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Layers size={20} color={color} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{sec.name}</p>
                                            <p style={{ fontSize: '0.7rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {YEAR_LABELS[sec.year] || `Year ${sec.year}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Department</span>
                                            <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{deptCode(sec.department_id) || deptName(sec.department_id)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Users size={11} />Students
                                            </span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: count > 0 ? 'var(--neon-emerald)' : 'var(--text-muted)' }}>{count}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                        <ChevronRight size={12} />Click to view full details
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {}
            <AnimatePresence>
                {selectedId && <SectionDrawer sectionId={selectedId} onClose={() => setSelectedId(null)} />}
            </AnimatePresence>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, RefreshCw, BrainCircuit, UploadCloud,
    Loader2, Images, X, User, BookOpen, GraduationCap,
    CalendarCheck, AlertTriangle, CheckCircle, Camera,
    ChevronRight, BarChart2,
} from 'lucide-react';
import { API } from '../config/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

function StudentDrawer({ studentId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        axios.get(`${API}/students/${studentId}/detail`, cfg())
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [studentId]);

    const pct = data?.attendance?.percentage;
    const color = pct === null ? '#3b82f6' : pct >= 80 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';
    const level = pct === null ? 'No records' : pct >= 80 ? '✅ Safe' : pct >= 65 ? '⚠️ Warning' : '🔴 Critical';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'flex-end',
        }} onClick={onClose}>
            <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: 420, height: '100vh', overflowY: 'auto',
                    background: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border-glow)',
                    boxShadow: 'var(--glow-blue)',
                    display: 'flex', flexDirection: 'column',
                }}>

                {}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2))',
                            border: '1px solid rgba(59,130,246,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <User size={20} color="var(--neon-blue)" />
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Student Profile</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Full Academic Record</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-dim)', borderTopColor: 'var(--neon-blue)', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading profile…</span>
                    </div>
                ) : !data ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load profile.</p>
                ) : (
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {}
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{data.student_name}</p>
                            <p style={{ fontSize: '0.8rem', fontFamily: 'Space Mono, monospace', color: 'var(--neon-blue)', marginBottom: '1rem' }}>{data.student_id}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[
                                    { label: 'Department', value: data.department },
                                    { label: 'Section', value: data.section ? `${data.section.name} (Year ${data.section.year})` : 'Not Assigned' },
                                    { label: 'Face Photos', value: `${data.photo_count} uploaded`, color: data.has_photos ? '#10b981' : '#f59e0b' },
                                    { label: 'AI Model', value: data.has_photos ? 'Trained ✓' : 'Not Trained', color: data.has_photos ? '#10b981' : '#f59e0b' },
                                ].map(r => (
                                    <div key={r.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
                                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 3 }}>{r.label}</p>
                                        <p style={{ fontWeight: 600, fontSize: '0.8rem', color: r.color || 'var(--text-primary)' }}>{r.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {}
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Attendance Summary</p>
                            <div style={{ position: 'relative', display: 'inline-block', width: 110, height: 110 }}>
                                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="10" />
                                    <circle cx="55" cy="55" r="42" fill="none" stroke={color} strokeWidth="10"
                                        strokeDasharray={`${(pct || 0) * 2.638} 263.8`} strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{pct !== null ? `${pct}%` : '—'}</span>
                                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>{data.attendance.present}</p>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.1rem' }}>{data.attendance.absent}</p>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{level}</p>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</p>
                                </div>
                            </div>
                        </div>

                        {}
                        {data.subjects.length > 0 && (
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>📚 Subjects</p>
                                </div>
                                {data.subjects.map(s => (
                                    <div key={s.code} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{s.name}</p>
                                            <p style={{ fontSize: '0.65rem', fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>{s.code}</p>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                            <GraduationCap size={11} style={{ display: 'inline', marginRight: 4 }} />
                                            {s.teacher}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {}
                        {data.teachers.length > 0 && (
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>👩‍🏫 Subject Teachers</p>
                                </div>
                                {data.teachers.map(t => (
                                    <div key={t.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: '50%',
                                            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.75rem', color: '#8b5cf6', flexShrink: 0,
                                        }}>{t.name?.charAt(0)}</div>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{t.name}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {}
                        {data.recent_attendance.length > 0 && (
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-dim)' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>🕒 Recent Attendance</p>
                                </div>
                                {data.recent_attendance.map((r, i) => (
                                    <div key={i} style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid rgba(56,105,177,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{r.subject}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>{r.date}</p>
                                        </div>
                                        <span className={`badge ${r.status === 'Present' ? 'badge-emerald' : 'badge-rose'}`}>{r.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({ student_name: '', student_id: '', department: '', section_id: '' });
    const [uploadState, setUploadState] = useState({});
    const [toast, setToast] = useState('');
    const [search, setSearch] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [s, sec] = await Promise.all([
                axios.get(`${API}/students/`, cfg()),
                axios.get(`${API}/sections/`),
            ]);
            setStudents(s.data);
            setSections(sec.data);
        } catch { showToast('❌ Failed to fetch students.'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, section_id: formData.section_id ? +formData.section_id : null };
            await axios.post(`${API}/students/`, payload, cfg());
            setFormData({ student_name: '', student_id: '', department: '', section_id: '' });
            setShowForm(false);
            fetchAll();
            showToast('✅ Student registered!');
        } catch (err) {
            showToast('❌ ' + (err.response?.data?.detail || 'Could not add student.'));
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name} and all their face data?`)) return;
        try {
            await axios.delete(`${API}/students/${id}`, cfg());
            if (selectedId === id) setSelectedId(null);
            fetchAll();
            showToast('🗑️ Student deleted.');
        } catch { showToast('❌ Delete failed.'); }
    };

    const toggleUpload = (id) => setUploadState(prev => ({
        ...prev,
        [id]: prev[id]?.open ? { open: false } : { open: true, files: null, status: null, msg: null },
    }));

    const setFiles = (id, files) => setUploadState(prev => ({ ...prev, [id]: { ...prev[id], files } }));

    const handleUploadAndTrain = async (student) => {
        const files = uploadState[student.id]?.files;
        if (!files || files.length === 0) { showToast('⚠️ Select at least one image first.'); return; }
        setUploadState(prev => ({ ...prev, [student.id]: { ...prev[student.id], status: 'uploading' } }));
        try {
            const form = new FormData();
            Array.from(files).forEach(f => form.append('files', f));
            const res = await axios.post(`${API}/model/upload/${student.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const msg = `✅ ${res.data.faces_saved} face(s) saved. Model retrained on ${res.data.students} students.`;
            setUploadState(prev => ({ ...prev, [student.id]: { ...prev[student.id], status: 'done', msg } }));
            showToast(msg); fetchAll();
        } catch (err) {
            const errMsg = '❌ ' + (err.response?.data?.detail || 'Upload failed.');
            setUploadState(prev => ({ ...prev, [student.id]: { ...prev[student.id], status: 'error', msg: errMsg } }));
            showToast(errMsg);
        }
    };

    const sectionName = (id) => sections.find(s => s.id === id)?.name || '—';
    const filtered = students.filter(s =>
        !search || s.student_name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase())
    );

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
                        <h1 className="page-title">Student Management</h1>
                        <p className="page-subtitle">Click any student row to view full profile · {students.length} total</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={fetchAll} className="btn btn-ghost"><RefreshCw size={15} className={loading ? 'spin' : ''} /></button>
                        <button onClick={() => axios.post(`${API}/model/train`).then(() => showToast('✅ Model retrained!'))} className="btn btn-ghost">
                            <BrainCircuit size={15} />Retrain AI
                        </button>
                        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
                            <Plus size={16} />Add Student
                        </button>
                    </div>
                </div>

                {}
                <div style={{ position: 'relative' }}>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or roll number…" className="input"
                        style={{ paddingLeft: '1rem' }} />
                </div>

                {}
                <AnimatePresence>
                    {showForm && (
                        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleCreate} className="glass-card" style={{ overflow: 'hidden', padding: '1.5rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Register New Student</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div><label className="label">Full Name</label><input required placeholder="Monish Kumar" value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} className="input" /></div>
                                <div><label className="label">Roll Number</label><input required placeholder="CSE2021001" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} className="input" /></div>
                                <div><label className="label">Department</label><input required placeholder="Computer Science" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="input" /></div>
                                <div>
                                    <label className="label">Section</label>
                                    <select value={formData.section_id} onChange={e => setFormData({ ...formData, section_id: e.target.value })} className="input">
                                        <option value="">No section</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-primary">Save Student</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {['Student', 'Roll No', 'Department', 'Section', 'Face Data', 'Actions'].map(h => <th key={h}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading students…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students found.</td></tr>
                                ) : filtered.map(student => {
                                    const up = uploadState[student.id] || {};
                                    return (
                                        <React.Fragment key={student.id}>
                                            <tr style={{ cursor: 'pointer' }} onClick={() => setSelectedId(student.id)}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: 34, height: 34, borderRadius: '50%',
                                                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: '0.875rem', color: 'var(--neon-blue)', flexShrink: 0,
                                                        }}>{student.student_name?.charAt(0)?.toUpperCase()}</div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.student_name}</p>
                                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Click to view profile</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.student_id}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{student.department}</td>
                                                <td>
                                                    {student.section_id
                                                        ? <span className="badge badge-blue">{sectionName(student.section_id)}</span>
                                                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    {student.image_path
                                                        ? <span className="badge badge-emerald"><CheckCircle size={11} /> Uploaded</span>
                                                        : <span className="badge badge-amber"><AlertTriangle size={11} /> No Photos</span>}
                                                </td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button title="Upload face images" onClick={() => toggleUpload(student.id)}
                                                            className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', background: up.open ? 'rgba(59,130,246,0.2)' : undefined }}>
                                                            <Images size={14} />
                                                        </button>
                                                        <button title="Delete student" onClick={() => handleDelete(student.id, student.student_name)}
                                                            className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {}
                                            <AnimatePresence>
                                                {up.open && (
                                                    <tr><td colSpan={6} style={{ padding: 0 }}>
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden', background: 'rgba(3,13,26,0.6)', borderTop: '1px solid var(--border-dim)', padding: '1.25rem 1.5rem' }}>
                                                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                                                                Upload face photos for <span style={{ color: 'var(--neon-blue)' }}>{student.student_name}</span>
                                                            </p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                                Select 10–30 clear front-facing photos. AI model <strong style={{ color: 'var(--neon-emerald)' }}>retrains automatically</strong> after upload.
                                                            </p>
                                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                                                <label style={{
                                                                    flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                                    padding: '0.875rem 1rem', borderRadius: '0.65rem', cursor: 'pointer',
                                                                    background: 'rgba(59,130,246,0.05)',
                                                                    border: '2px dashed rgba(59,130,246,0.3)',
                                                                }}>
                                                                    <UploadCloud size={18} color="var(--neon-blue)" />
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                        {up.files?.length ? `${up.files.length} file(s) selected` : 'Click to select images'}
                                                                    </span>
                                                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                                                        onChange={e => setFiles(student.id, e.target.files)} />
                                                                </label>
                                                                <button onClick={() => handleUploadAndTrain(student)} disabled={up.status === 'uploading'}
                                                                    className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                                                                    {up.status === 'uploading' ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Uploading…</> : <><Camera size={14} />Upload & Train</>}
                                                                </button>
                                                            </div>
                                                            {up.msg && (
                                                                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', background: up.status === 'done' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: up.status === 'done' ? '#10b981' : '#ef4444' }}>{up.msg}</p>
                                                            )}
                                                        </motion.div>
                                                    </td></tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {}
            <AnimatePresence>
                {selectedId && <StudentDrawer studentId={selectedId} onClose={() => setSelectedId(null)} />}
            </AnimatePresence>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}

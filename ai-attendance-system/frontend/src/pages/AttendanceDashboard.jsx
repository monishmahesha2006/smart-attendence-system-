import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, RefreshCw, Filter, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { API } from '../config/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function AttendanceDashboard() {
    const [records, setRecords] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selSec, setSelSec] = useState('');
    const [selSub, setSelSub] = useState('');
    const [dateQ, setDateQ] = useState(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);

    
    useEffect(() => {
        axios.get(`${API}/me/sections`, cfg()).then(r => setSections(r.data)).catch(() => { });
        axios.get(`${API}/me/subjects`, cfg()).then(r => setSubjects(r.data)).catch(() => { });
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateQ) params.append('date_query', dateQ);
            if (selSec) params.append('section_id', selSec);
            if (selSub) params.append('subject_id', selSub);
            const res = await axios.get(`${API}/me/attendance?${params}`, cfg());
            setRecords(res.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [dateQ, selSec, selSub]);

    const exportCSV = async () => {
        const params = new URLSearchParams();
        if (selSec) params.append('section_id', selSec);
        if (selSub) params.append('subject_id', selSub);
        if (dateQ) { params.append('date_from', dateQ); params.append('date_to', dateQ); }
        const res = await axios.get(`${API}/attendance/export?${params}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a'); a.href = url; a.download = `attendance_${dateQ}.csv`; a.click();
    };

    const override = async (id, status) => {
        await axios.put(`${API}/attendance/${id}/status?status=${status}`);
        setEditId(null);
        load();
    };

    const filtered = records.filter(r =>
        !search ||
        r.student?.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.student_id?.toLowerCase().includes(search.toLowerCase())
    );

    const present = filtered.filter(r => r.status === 'Present');
    const absent = filtered.filter(r => r.status === 'Absent');
    const manual = filtered.filter(r => r.status === 'Manual');

    const StatusBadge = ({ status }) => (
        <span className={`badge ${status === 'Present' ? 'badge-emerald' : status === 'Absent' ? 'badge-rose' : 'badge-amber'}`}>
            {status}
        </span>
    );

    return (
        <div className="page-enter" style={{ position: 'relative' }}>
            <div className="bg-orbs" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <h1 className="page-title">Attendance Records</h1>
                        <p className="page-subtitle">{filtered.length} records matching your filters</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" onClick={load}>
                            <RefreshCw size={15} className={loading ? 'spin' : ''} />
                        </button>
                        <button className="btn btn-emerald" onClick={exportCSV}>
                            <Download size={15} />Export CSV
                        </button>
                    </div>
                </div>

                {}
                <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                        <div>
                            <label className="label">Date</label>
                            <input type="date" value={dateQ} onChange={e => setDateQ(e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Section</label>
                            <select value={selSec} onChange={e => setSelSec(e.target.value)} className="input">
                                <option value="">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Subject</label>
                            <select value={selSub} onChange={e => setSelSub(e.target.value)} className="input">
                                <option value="">All Subjects</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Search</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Name or roll no…" className="input" style={{ paddingLeft: '2.25rem' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total', count: filtered.length, cls: 'badge-blue' },
                        { label: 'Present', count: present.length, cls: 'badge-emerald' },
                        { label: 'Absent', count: absent.length, cls: 'badge-rose' },
                        { label: 'Manual', count: manual.length, cls: 'badge-amber' },
                    ].map(p => (
                        <span key={p.label} className={`badge ${p.cls}`} style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
                            {p.label}: {p.count}
                        </span>
                    ))}
                </div>

                {}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {['Student', 'Roll No', 'Section', 'Subject', 'Date', 'Time', 'Status', 'Action'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No records for selected filters.</td></tr>
                                ) : filtered.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{r.student?.student_name}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.student?.student_id}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.subject_id ? `#${r.subject_id}` : '—'}</td>
                                        <td>{r.date}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{String(r.time).slice(0, 5)}</td>
                                        <td>
                                            {editId === r.id ? (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {['Present', 'Absent', 'Manual'].map(s => (
                                                        <button key={s} onClick={() => override(r.id, s)}
                                                            className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : <StatusBadge status={r.status} />}
                                        </td>
                                        <td>
                                            <button onClick={() => setEditId(editId === r.id ? null : r.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                                <Edit3 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}

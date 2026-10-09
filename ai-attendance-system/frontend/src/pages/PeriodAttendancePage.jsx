import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Download, CheckCircle, XCircle, RefreshCw, PenSquare } from 'lucide-react';
import { API } from '../config/api';
const STATUS_OPTS = ['Present', 'Absent', 'Manual'];

export default function PeriodAttendancePage() {
    const [records, setRecords] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSection, setSection] = useState('');
    const [selectedSubject, setSubject] = useState('');
    const [dateQuery, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [overrideId, setOverrideId] = useState(null);

    useEffect(() => {
        axios.get(`${API}/sections/`).then(r => setSections(r.data));
        axios.get(`${API}/subjects/`).then(r => setSubjects(r.data));
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateQuery) params.append('date_query', dateQuery);
            if (selectedSection) params.append('section_id', selectedSection);
            if (selectedSubject) params.append('subject_id', selectedSubject);
            const res = await axios.get(`${API}/attendance/?${params}`);
            setRecords(res.data);
        } catch {  }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [dateQuery, selectedSection, selectedSubject]);

    const override = async (id, status) => {
        await axios.put(`${API}/attendance/${id}/status?status=${status}`);
        setOverrideId(null);
        load();
    };

    const exportCSV = async () => {
        const params = new URLSearchParams();
        if (selectedSection) params.append('section_id', selectedSection);
        if (selectedSubject) params.append('subject_id', selectedSubject);
        if (dateQuery) params.append('date_from', dateQuery);
        if (dateQuery) params.append('date_to', dateQuery);
        const res = await axios.get(`${API}/attendance/export?${params}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${dateQuery}.csv`;
        a.click();
    };

    const filtered = records.filter(r =>
        !search ||
        r.student?.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.student_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white">Period Attendance</h1>
                    <p className="text-slate-400 text-sm mt-1">View, filter and correct attendance records by period.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input type="date" value={dateQuery} onChange={e => setDate(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />

                <select value={selectedSection} onChange={e => setSection(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none text-sm">
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select value={selectedSubject} onChange={e => setSubject(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none text-sm">
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input placeholder="Search student…" value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none text-sm" />
                </div>
            </div>

            {}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 border-b border-slate-700">
                        <tr>
                            {['Student', 'Roll No', 'Subject', 'Date', 'Time', 'Status', 'Override'].map(h => (
                                <th key={h} className="px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No records found.</td></tr>
                        ) : filtered.map(r => (
                            <tr key={r.id} className="hover:bg-slate-750/30">
                                <td className="px-4 py-3 font-medium text-white">{r.student?.student_name}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.student?.student_id}</td>
                                <td className="px-4 py-3 text-slate-400">{r.subject_id ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-300">{r.date}</td>
                                <td className="px-4 py-3 text-slate-400">{r.time}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === 'Present' ? 'bg-emerald-500/20 text-emerald-400' :
                                            r.status === 'Absent' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                        }`}>{r.status}</span>
                                </td>
                                <td className="px-4 py-3">
                                    {overrideId === r.id ? (
                                        <div className="flex gap-1">
                                            {STATUS_OPTS.map(s => (
                                                <button key={s} onClick={() => override(r.id, s)}
                                                    className="px-2 py-1 bg-slate-700 hover:bg-blue-600 rounded text-white text-xs transition">{s}</button>
                                            ))}
                                            <button onClick={() => setOverrideId(null)} className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">✕</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setOverrideId(r.id)} className="p-1.5 text-slate-500 hover:text-blue-400 transition">
                                            <PenSquare size={15} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-4 py-3 border-t border-slate-700 text-slate-500 text-xs">
                    {filtered.length} record(s) shown
                </div>
            </div>
        </div>
    );
}

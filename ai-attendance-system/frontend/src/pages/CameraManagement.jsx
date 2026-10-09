import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Video, Edit3, CheckCircle, XCircle } from 'lucide-react';
import { API } from '../config/api';

export default function CameraManagement() {
    const [cameras, setCameras] = useState([]);
    const [sections, setSections] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ room_name: '', stream_url: '', section_id: '', active: true });

    const load = () => {
        axios.get(`${API}/cameras/`).then(r => setCameras(r.data));
        axios.get(`${API}/sections/`).then(r => setSections(r.data));
    };
    useEffect(() => { load(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        const payload = { ...form, section_id: form.section_id ? +form.section_id : null };
        if (editId) await axios.put(`${API}/cameras/${editId}`, payload);
        else await axios.post(`${API}/cameras/`, payload);
        setShowForm(false); setEditId(null);
        setForm({ room_name: '', stream_url: '', section_id: '', active: true });
        load();
    };

    const startEdit = (cam) => {
        setEditId(cam.id);
        setForm({ room_name: cam.room_name, stream_url: cam.stream_url || '', section_id: cam.section_id || '', active: cam.active });
        setShowForm(true);
    };

    const del = async (id) => {
        if (!window.confirm('Remove camera?')) return;
        await axios.delete(`${API}/cameras/${id}`);
        load();
    };

    const sectionName = id => sections.find(s => s.id === id)?.name ?? 'Unassigned';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Camera Management</h1>
                    <p className="text-slate-400 text-sm mt-1">Register and link classroom cameras to sections.</p>
                </div>
                <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ room_name: '', stream_url: '', section_id: '', active: true }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
                    <Plus size={18} /> Add Camera
                </button>
            </div>

            {showForm && (
                <form onSubmit={submit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-full text-sm font-semibold text-white">{editId ? 'Edit Camera' : 'New Camera'}</div>
                    <input required placeholder="Room name (e.g. Lab 101)" value={form.room_name}
                        onChange={e => setForm({ ...form, room_name: e.target.value })}
                        className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm" />
                    <input placeholder="Stream URL or webcam index (0, 1…)" value={form.stream_url}
                        onChange={e => setForm({ ...form, stream_url: e.target.value })}
                        className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm" />
                    <select value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}
                        className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm">
                        <option value="">Unassigned</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-slate-300 text-sm px-3">
                        <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                        Active
                    </label>
                    <div className="col-span-full flex gap-3">
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium">
                            {editId ? 'Update' : 'Create'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-slate-700 rounded-xl text-white">Cancel</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cameras.map(cam => (
                    <div key={cam.id} className={`bg-slate-800 border rounded-2xl p-5 ${cam.active ? 'border-slate-700' : 'border-slate-700/30 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${cam.active ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                                    <Video size={20} className={cam.active ? 'text-blue-400' : 'text-slate-500'} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{cam.room_name}</p>
                                    <p className="text-slate-400 text-xs">Section: {sectionName(cam.section_id)}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(cam)} className="p-1.5 text-slate-500 hover:text-blue-400 transition"><Edit3 size={15} /></button>
                                <button onClick={() => del(cam.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition"><Trash2 size={15} /></button>
                            </div>
                        </div>
                        <div className="space-y-1 text-xs text-slate-500">
                            <div className="flex justify-between">
                                <span>Stream</span><span className="text-slate-300 font-mono">{cam.stream_url || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Status</span>
                                {cam.active
                                    ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} />Active</span>
                                    : <span className="flex items-center gap-1 text-slate-500"><XCircle size={12} />Inactive</span>}
                            </div>
                        </div>
                    </div>
                ))}
                {cameras.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-8">No cameras registered yet.</p>}
            </div>
        </div>
    );
}

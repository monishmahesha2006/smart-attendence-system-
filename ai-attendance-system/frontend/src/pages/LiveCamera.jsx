import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, Power, CheckCircle, BrainCircuit, Users, AlertCircle, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../config/api';

const CONSECUTIVE_FRAMES_REQUIRED = 3;

export default function LiveCamera() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const frameVotesRef = useRef({});   
    const confirmedRef = useRef(new Set()); 

    const [isOn, setIsOn] = useState(false);
    const [recognized, setRecognized] = useState([]);
    const [lastFrame, setLastFrame] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [trainStatus, setTrainStatus] = useState(null);
    const [trainLoading, setTrainLoading] = useState(false);
    const [error, setError] = useState('');

    
    const drawBoxes = useCallback((detections) => {
        const canvas = canvasRef.current;
        const video = webcamRef.current?.video;
        if (!canvas || !video) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach(d => {
            const [x, y, w, h] = d.bbox;
            const conf = d.confidence;
            const confirmed = confirmedRef.current.has(d.id);
            const votes = frameVotesRef.current[d.id] || 0;

            
            const color = confirmed ? '#10b981' : votes >= 2 ? '#3b82f6' : '#f59e0b';

            ctx.shadowColor = color;
            ctx.shadowBlur = 16;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;

            const statusText = confirmed ? '✓' : `${votes}/${CONSECUTIVE_FRAMES_REQUIRED}`;
            const label = `${d.student_name}  ${conf}%  [${statusText}]`;
            ctx.font = 'bold 12px Inter, sans-serif';
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = color + 'cc';
            ctx.fillRect(x, y - 24, tw + 12, 22);
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x + 6, y - 7);
        });
    }, []);

    
    const captureAndRecognize = useCallback(async () => {
        if (!isOn || !webcamRef.current) return;
        const imgSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
        if (!imgSrc) return;

        try {
            setIsProcessing(true);
            setError('');

            const blob = await (await fetch(imgSrc)).blob();
            const form = new FormData();
            form.append('file', new File([blob], 'frame.jpg', { type: 'image/jpeg' }));

            const resp = await axios.post(`${API}/model/recognize`, form);
            const faces = resp.data.recognized_faces || [];

            setLastFrame(faces);
            drawBoxes(faces);

            
            const seenThisFrame = new Set(faces.map(f => f.id));

            
            const newVotes = {};
            faces.forEach(f => {
                newVotes[f.id] = (frameVotesRef.current[f.id] || 0) + 1;
            });
            frameVotesRef.current = newVotes;

            
            const newlyConfirmed = [];
            faces.forEach(f => {
                if (
                    (frameVotesRef.current[f.id] || 0) >= CONSECUTIVE_FRAMES_REQUIRED &&
                    !confirmedRef.current.has(f.id)
                ) {
                    confirmedRef.current.add(f.id);
                    newlyConfirmed.push(f);
                }
            });

            if (newlyConfirmed.length > 0) {
                setRecognized(prev => {
                    const map = new Map(prev.map(s => [s.id, s]));
                    newlyConfirmed.forEach(f => map.set(f.id, f));
                    return Array.from(map.values());
                });
            }

        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            if (msg && !msg.includes('not trained')) setError(msg);
        } finally {
            setIsProcessing(false);
        }
    }, [isOn, drawBoxes]);

    useEffect(() => {
        if (isOn) {
            intervalRef.current = setInterval(captureAndRecognize, 1500);
        } else {
            clearInterval(intervalRef.current);
            setLastFrame([]);
            frameVotesRef.current = {};
            confirmedRef.current = new Set();
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, 9999, 9999);
        }
        return () => clearInterval(intervalRef.current);
    }, [isOn, captureAndRecognize]);

    const handleTrain = async () => {
        setTrainLoading(true); setTrainStatus(null);
        try {
            const res = await axios.post(`${API}/model/train`);
            setTrainStatus({ ok: true, msg: res.data.message });
        } catch (err) {
            setTrainStatus({ ok: false, msg: err.response?.data?.detail || 'Training failed.' });
        } finally { setTrainLoading(false); }
    };

    const handleToggle = () => {
        setIsOn(v => !v);
        setRecognized([]);
        setError('');
        setTrainStatus(null);
    };

    return (
        <div className="space-y-6">
            {}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Live Attendance Camera</h1>
                    <p className="text-slate-400 mt-1 text-sm">
                        A student must appear in <strong className="text-blue-400">{CONSECUTIVE_FRAMES_REQUIRED} consecutive frames</strong> before attendance is marked — prevents false positives.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleTrain} disabled={trainLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium transition">
                        <BrainCircuit size={18} />{trainLoading ? 'Training…' : 'Train AI Model'}
                    </button>
                    <button onClick={handleToggle}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition shadow-md ${isOn ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                            } text-white`}>
                        <Power size={18} />{isOn ? 'Stop Camera' : 'Start Camera'}
                    </button>
                </div>
            </div>

            {}
            <AnimatePresence>
                {trainStatus && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium ${trainStatus.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        {trainStatus.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span>{trainStatus.msg}</span>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="px-5 py-3 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 text-sm">
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {}
                <div className="lg:col-span-2 relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl min-h-[480px] flex items-center justify-center">
                    {!isOn ? (
                        <div className="text-center text-slate-500 p-10">
                            <Camera size={72} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xl font-medium mb-1">Camera is offline</p>
                            <p className="text-sm opacity-60">Click "Start Camera" to begin live recognition</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                                videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                                className="w-full h-full object-cover" mirrored={false} />
                            <canvas ref={canvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{ objectFit: 'cover' }} />

                            {}
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-full px-4 py-1.5 flex items-center gap-2 text-white text-xs font-medium">
                                <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                                <span>{isProcessing ? 'Analyzing…' : lastFrame.length > 0 ? `${lastFrame.length} detected` : 'Scanning…'}</span>
                            </div>

                            {lastFrame.length > 0 && (
                                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-blue-600/80 backdrop-blur rounded-xl px-4 py-2 text-white text-sm font-medium">
                                    <Users size={15} />
                                    <span>{lastFrame.length} face(s) in frame — need {CONSECUTIVE_FRAMES_REQUIRED} consecutive detections</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col" style={{ maxHeight: '480px' }}>
                    <div className="p-4 border-b border-slate-700 bg-slate-900 rounded-t-2xl flex justify-between items-center">
                        <h3 className="font-semibold text-white text-sm">Confirmed Present Today</h3>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                            {recognized.length} confirmed
                        </span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-2">
                        {!isOn ? (
                            <p className="text-center text-slate-500 text-sm mt-8">Start camera to see live attendance.</p>
                        ) : recognized.length === 0 ? (
                            <p className="text-center text-slate-500 text-sm mt-8">
                                Scanning… <br />
                                <span className="text-xs mt-1 block">(Needs {CONSECUTIVE_FRAMES_REQUIRED} consecutive detections)</span>
                            </p>
                        ) : (
                            <AnimatePresence>
                                {recognized.map((s, i) => (
                                    <motion.div key={s.id} initial={{ opacity: 0, x: 18 }}
                                        animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                        className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {s.student_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{s.student_name}</p>
                                                <p className="text-xs text-slate-400">{s.student_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-2 flex-shrink-0">
                                            <CheckCircle size={16} className="text-emerald-400 ml-auto" />
                                            <p className="text-[10px] text-slate-500 mt-0.5">{s.confidence}%</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {}
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block"></span>Detected (collecting votes)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span>Almost confirmed</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>Confirmed — attendance marked</span>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {[
                    { icon: '💡', title: 'Good Lighting', desc: 'Face the light source. Avoid backlit environments.' },
                    { icon: '📏', title: 'Distance', desc: 'Stay 40–120 cm from the camera for best accuracy.' },
                    { icon: '👁️', title: 'Face Forward', desc: 'Look directly at the camera. Hold still for 3 frames.' },
                ].map(t => (
                    <div key={t.title} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <p className="font-semibold text-white mb-1">{t.icon} {t.title}</p>
                        <p className="text-slate-400 text-xs">{t.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

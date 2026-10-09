import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, CalendarCheck, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
            {}
            <nav className="flex items-center justify-between p-6 lg:px-20 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                    <Camera className="text-blue-500 h-8 w-8" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">AI Attend</span>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition font-medium"
                    >
                        Admin Login
                    </button>
                </div>
            </nav>

            {}
            <main className="flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32 relative overflow-hidden">
                {}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10 max-w-4xl"
                >
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium tracking-wide">
                        Next Generation Attendance System
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        Automate Attendance with <br className="hidden lg:block" />
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Face Recognition</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Eliminate traditional roll calls. Track student attendance instantly, accurately, and securely using AI-driven real-time face recognition technology.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                        >
                            <span>Get Started</span>
                            <ShieldCheck size={20} />
                        </button>
                    </div>
                </motion.div>

                {}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-20 w-full max-w-5xl relative z-10"
                >
                    <div className="glass rounded-2xl p-2 shadow-2xl">
                        <div className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center relative">
                            <Camera className="w-24 h-24 text-slate-600 absolute opacity-20" />
                            <div className="text-center text-slate-400 z-10">
                                <p className="text-xl font-medium">Real-time Dashboard View</p>
                                <p className="text-sm mt-2 opacity-60">Log in to view the actual dashboard</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LandingPage;

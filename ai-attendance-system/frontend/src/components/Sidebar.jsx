import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, CalendarCheck, Camera, BarChart2,
    LogOut, GraduationCap, Clock, Video,
    Building2, BrainCircuit, Layers, ChevronRight, ShieldCheck,
} from 'lucide-react';

const MENUS = {
    super_admin: [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', to: '/analytics', icon: BarChart2 },
        { label: 'Attendance', to: '/attendance', icon: CalendarCheck },
        { label: 'Live Camera', to: '/live-camera', icon: Camera },
        { section: 'Management' },
        { label: 'User Management', to: '/admin/users', icon: ShieldCheck },
        { label: 'Sections', to: '/sections', icon: Layers },
        { label: 'Teachers', to: '/teachers-mgmt', icon: GraduationCap },
        { label: 'Students', to: '/students', icon: Users },
        { label: 'Timetable', to: '/timetable', icon: Clock },
        { label: 'Cameras', to: '/cameras', icon: Video },
    ],
    dept_admin: [
        { label: 'Overview', to: '/dept-dashboard', icon: LayoutDashboard },
        { label: 'Analytics', to: '/analytics', icon: BarChart2 },
        { label: 'Attendance', to: '/attendance', icon: CalendarCheck },
        { label: 'Live Camera', to: '/live-camera', icon: Camera },
        { section: 'Department' },
        { label: 'My Teachers', to: '/teachers-mgmt', icon: GraduationCap },
        { label: 'Sections', to: '/sections', icon: Layers },
        { label: 'Students', to: '/students', icon: Users },
        { label: 'Timetable', to: '/timetable', icon: Clock },
    ],
    teacher: [
        { label: 'Dashboard', to: '/teacher-dashboard', icon: LayoutDashboard },
        { label: 'My Attendance', to: '/attendance', icon: CalendarCheck },
        { label: 'Analytics', to: '/analytics', icon: BarChart2 },
        { label: 'Live Camera', to: '/live-camera', icon: Camera },
        { section: 'Students' },
        { label: 'My Students', to: '/students', icon: Users },
    ],
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || 'teacher';
    const menus = MENUS[role] || MENUS.teacher;

    const roleLabel = { super_admin: 'Super Admin', dept_admin: 'Dept Admin', teacher: 'Teacher' }[role] || role;
    const roleColor = { super_admin: '#3b82f6', dept_admin: '#10b981', teacher: '#8b5cf6' }[role] || '#3b82f6';

    return (
        <aside className="sidebar">
            {}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <BrainCircuit size={22} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        AI Attend
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        v3.0 · College System
                    </div>
                </div>
            </div>

            {}
            <nav className="sidebar-nav">
                {menus.map((item, idx) => {
                    if (item.section) {
                        return <div key={idx} className="sidebar-section-label">{item.section}</div>;
                    }
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                        <NavLink key={item.to} to={item.to} className={`nav-item${active ? ' active' : ''}`}>
                            <Icon size={17} className="nav-icon" />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
                        </NavLink>
                    );
                })}
            </nav>

            {}
            <div className="sidebar-footer">
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: '0.75rem',
                    background: 'rgba(255,255,255,0.03)', marginBottom: '0.75rem',
                    border: '1px solid var(--border-dim)',
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
                        border: `1px solid ${roleColor}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: roleColor, fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                    }}>
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: roleColor,
                        }}>
                            {roleLabel}
                        </div>
                    </div>
                </div>
                <button
                    className="nav-item"
                    style={{ width: '100%', color: 'var(--neon-rose)' }}
                    onClick={() => { logout(); navigate('/login'); }}
                >
                    <LogOut size={17} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

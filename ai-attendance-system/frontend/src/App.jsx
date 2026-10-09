import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DeptAdminDashboard from './pages/DeptAdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentManagement from './pages/StudentManagement';
import AttendanceDashboard from './pages/AttendanceDashboard';
import LiveCamera from './pages/LiveCamera';
import AnalyticsPage from './pages/AnalyticsPage';
import TimetablePage from './pages/TimetablePage';
import SectionManagement from './pages/SectionManagement';
import CameraManagement from './pages/CameraManagement';
import PeriodAttendancePage from './pages/PeriodAttendancePage';
import Sidebar from './components/Sidebar';
import AdminUserManagement from './pages/AdminUserManagement';
import TeacherManagement from './pages/TeacherManagement';

const Shell = ({ children }) => (
    <div className="app-layout">
        <Sidebar />
        <main id="main-content" tabIndex="-1" role="main" className="main-content" aria-label="Main dashboard content">
            {children}
        </main>
    </div>
);

const Guard = ({ children, allow }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allow && !allow.includes(user?.role)) return <Navigate to="/home" replace />;
    return <Shell>{children}</Shell>;
};

const RoleRedirect = () => {
    const { user } = useAuth();
    if (user?.role === 'super_admin') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'dept_admin') return <Navigate to="/dept-dashboard" replace />;
    return <Navigate to="/teacher-dashboard" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {}
                    <Route path="/home" element={<Guard><RoleRedirect /></Guard>} />

                    {}
                    <Route path="/dashboard" element={<Guard allow={['super_admin']}><AdminDashboard /></Guard>} />
                    <Route path="/cameras" element={<Guard allow={['super_admin']}><CameraManagement /></Guard>} />

                    {}
                    <Route path="/admin/users" element={<Guard allow={['super_admin']}><AdminUserManagement /></Guard>} />

                    {}
                    <Route path="/dept-dashboard" element={<Guard allow={['dept_admin']}><DeptAdminDashboard /></Guard>} />

                    {}
                    <Route path="/teacher-dashboard" element={<Guard allow={['teacher']}><TeacherDashboard /></Guard>} />
                    <Route path="/period-attendance" element={<Guard allow={['teacher', 'super_admin', 'dept_admin']}><PeriodAttendancePage /></Guard>} />

                    {}
                    <Route path="/sections" element={<Guard><SectionManagement /></Guard>} />
                    <Route path="/timetable" element={<Guard><TimetablePage /></Guard>} />
                    <Route path="/students" element={<Guard><StudentManagement /></Guard>} />
                    <Route path="/attendance" element={<Guard><AttendanceDashboard /></Guard>} />
                    <Route path="/live-camera" element={<Guard><LiveCamera /></Guard>} />
                    <Route path="/analytics" element={<Guard><AnalyticsPage /></Guard>} />
                    <Route path="/teachers-mgmt" element={<Guard allow={['super_admin', 'dept_admin']}><TeacherManagement /></Guard>} />

                    {}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

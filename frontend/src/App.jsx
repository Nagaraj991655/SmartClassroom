import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authStorage } from './services/api';
import Navbar from './components/Navbar';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getToken();
    if (user && token) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user && user.role === 'admin') {
      navigate('/staff/ad_dashboard', { replace: true });
    } else if (user && user.role === 'teacher') {
      navigate('/staff/te_dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleLogout = () => {
    const user = currentUser || authStorage.getUser();
    const role = user?.role;
    const wasAdmin = role === 'admin' || location.pathname.startsWith('/staff/ad') || location.pathname.startsWith('/admin');
    const wasTeacher = role === 'teacher' || location.pathname.startsWith('/staff/te') || location.pathname.startsWith('/staff/login') || location.pathname.startsWith('/teacher');

    authStorage.clearAuth();
    setCurrentUser(null);

    if (wasAdmin) {
      navigate('/staff/adlogin', { replace: true });
    } else if (wasTeacher) {
      navigate('/staff/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const adminDashboard =
    currentUser && currentUser.role === 'admin' && authStorage.getToken() ? (
      <AdminDashboard user={currentUser} onLogout={handleLogout} />
    ) : (
      <Navigate to="/staff/adlogin" replace />
    );

  const teacherDashboard =
    currentUser && currentUser.role === 'teacher' && authStorage.getToken() ? (
      <TeacherDashboard user={currentUser} onLogout={handleLogout} />
    ) : (
      <Navigate to="/staff/login" replace />
    );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090b10',
        color: '#f97316',
        fontFamily: "'Inter', sans-serif",
        fontSize: '1rem',
        fontWeight: 600
      }}>
        <p>Loading SmartClassroom...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Student Login: /login and /student/login */}
      <Route
        path="/login"
        element={
          currentUser ? (
            currentUser.role === 'admin' ? (
              <Navigate to="/staff/ad_dashboard" replace />
            ) : currentUser.role === 'teacher' ? (
              <Navigate to="/staff/te_dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <StudentLoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/student/login" element={<Navigate to="/login" replace />} />
      <Route path="/student/st_login" element={<Navigate to="/login" replace />} />

      {/* 2. Teacher Login: /staff/login and /teacher/login */}
      <Route
        path="/staff/login"
        element={
          currentUser ? (
            currentUser.role === 'admin' ? (
              <Navigate to="/staff/ad_dashboard" replace />
            ) : currentUser.role === 'teacher' ? (
              <Navigate to="/staff/te_dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <TeacherLoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/teacher/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/staff/te_login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/staff/telogin" element={<Navigate to="/staff/login" replace />} />
      <Route path="/staff/teacher-login" element={<Navigate to="/staff/login" replace />} />

      {/* 3. Admin Login: /staff/adlogin and meaningful aliases */}
      <Route
        path="/staff/adlogin"
        element={
          currentUser ? (
            currentUser.role === 'admin' ? (
              <Navigate to="/staff/ad_dashboard" replace />
            ) : currentUser.role === 'teacher' ? (
              <Navigate to="/staff/te_dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <AdminLoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/staff/ad_login" element={<Navigate to="/staff/adlogin" replace />} />
      <Route path="/staff/admin-login" element={<Navigate to="/staff/adlogin" replace />} />
      <Route path="/admin/login" element={<Navigate to="/staff/adlogin" replace />} />

      {/* 4. Admin Dashboard (Dedicated Route with JWT Guard & Sidebar Layout) */}
      <Route path="/staff/ad_dashboard" element={<Navigate to="/staff/ad_dashboard/home" replace />} />
      <Route path="/staff/ad_dashboard/*" element={adminDashboard} />
      <Route path="/admin/dashboard" element={<Navigate to="/staff/ad_dashboard" replace />} />

      {/* 5. Teacher Dashboard (Dedicated Route with Guard & Sidebar Layout) */}
      <Route path="/staff/te_dashboard" element={<Navigate to="/staff/te_dashboard/home" replace />} />
      <Route path="/staff/te_dashboard/*" element={teacherDashboard} />
      <Route path="/teacher/dashboard" element={<Navigate to="/staff/te_dashboard" replace />} />
      <Route path="/teacher" element={<Navigate to="/staff/te_dashboard" replace />} />

      {/* 6. General Dashboard / Student Dashboard */}
      <Route
        path="/"
        element={
          currentUser ? (
            currentUser.role === 'admin' ? (
              <Navigate to="/staff/ad_dashboard" replace />
            ) : currentUser.role === 'teacher' ? (
              <Navigate to="/staff/te_dashboard" replace />
            ) : (
              <div className="app-container">
                <Navbar user={currentUser} onLogout={handleLogout} />
                <main style={{ flex: 1 }}>
                  <StudentDashboard user={currentUser} />
                </main>
              </div>
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import React, { createContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FocusPage from './pages/FocusPage.jsx';
import GardenPage from './pages/GardenPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AdminAnnouncements from './pages/AdminAnnouncements.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSounds from './pages/AdminSounds.jsx';
import api from './api.js';

export const AuthContext = createContext(null);

function ProtectedLayout({ isAdmin, onLogout }) {
  const { token, profile, role } = React.useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={`min-h-screen ${isAdmin ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50' : 'bg-gradient-to-br from-sky-50 via-emerald-50 to-white'}`}>
      <Navbar isAdmin={isAdmin} role={role} profile={profile} onLogout={onLogout} />
      <div className="page-shell">
        <Outlet />
      </div>
    </div>
  );
}

function AdminRoute() {
  const { role } = React.useContext(AuthContext);
  return role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => user?.role || 'user');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isAdmin = useMemo(() => role === 'admin', [role]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    api
      .get('/profile/')
      .then((res) => {
        setProfile(res.data);
        const merged = {
          id: user?.id,
          username: res.data.username,
          nickname: res.data.nickname || res.data.username,
          role: res.data.role || role,
        };
        setUser(merged);
        setRole(merged.role || 'user');
        localStorage.setItem('user', JSON.stringify(merged));
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [token]);

  const login = (newToken, userInfo) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userInfo) {
      setUser(userInfo);
      setRole(userInfo.role || 'user');
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setProfile(null);
    setUser(null);
    setRole('user');
    setToken(null);
  };

  const contextValue = useMemo(
    () => ({ token, profile, setProfile, login, logout, loadingProfile, user, role, setRole }),
    [token, profile, loadingProfile, user, role]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout isAdmin={isAdmin} onLogout={logout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksPage isAdmin={isAdmin} />} />
          <Route path="/focus" element={<FocusPage isAdmin={isAdmin} />} />
          <Route path="/garden" element={<GardenPage isAdmin={isAdmin} />} />
          <Route path="/stats" element={<StatsPage isAdmin={isAdmin} />} />
          <Route path="/profile" element={<ProfilePage isAdmin={isAdmin} />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/sounds" element={<AdminSounds />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

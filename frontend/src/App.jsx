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
import api from './api.js';

export const AuthContext = createContext(null);

function ProtectedLayout({ adminMode, onLogout }) {
  const { token, profile } = React.useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={`min-h-screen ${adminMode ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50' : 'bg-gradient-to-br from-sky-50 via-emerald-50 to-white'}`}>
      <Navbar adminMode={adminMode} profile={profile} onLogout={onLogout} />
      <div className="page-shell">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const adminMode = useMemo(() => {
    if (!profile) return false;
    const nickname = profile.nickname?.toLowerCase() || '';
    const username = profile.user?.username?.toLowerCase?.() || '';
    return nickname.includes('admin') || username.includes('admin');
  }, [profile]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    api
      .get('/profile/')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setProfile(null);
    setToken(null);
  };

  const contextValue = useMemo(
    () => ({ token, profile, setProfile, login, logout, loadingProfile }),
    [token, profile, loadingProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout adminMode={adminMode} onLogout={logout} />}>
          <Route path="/" element={<Dashboard adminMode={adminMode} />} />
          <Route path="/tasks" element={<TasksPage adminMode={adminMode} />} />
          <Route path="/focus" element={<FocusPage adminMode={adminMode} />} />
          <Route path="/garden" element={<GardenPage adminMode={adminMode} />} />
          <Route path="/stats" element={<StatsPage adminMode={adminMode} />} />
          <Route path="/profile" element={<ProfilePage adminMode={adminMode} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

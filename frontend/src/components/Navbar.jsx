import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../App.jsx';

export default function Navbar({ isAdmin, role, profile, onLogout }) {
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);

  const navItems = React.useMemo(() => {
    const common = [
      { path: '/', label: '仪表盘' },
      { path: '/tasks', label: '任务管理' },
      { path: '/garden', label: '花园' },
      { path: '/stats', label: '数据统计' },
      { path: '/profile', label: '个人中心' },
      { path: '/focus', label: '番茄专注' },
    ];
    if (role === 'admin') {
      return [
        { path: '/admin/dashboard', label: '管理概览' },
        { path: '/admin/announcements', label: '公告管理' },
        { path: '/admin/sounds', label: '声音管理' },
        { path: '/', label: '用户端' },
      ];
    }
    return common;
  }, [role]);

  const handleLogout = () => {
    try {
      const timer = JSON.parse(localStorage.getItem('timegarden.focusTimer'));
      if (timer?.status === 'running' && timer.endAt > Date.now()) {
        if (!window.confirm('当前专注仍在进行。退出将暂停计时，是否继续退出？')) return;
        const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        const paused = { ...timer, status: 'paused', remaining };
        delete paused.endAt;
        localStorage.setItem('timegarden.focusTimer', JSON.stringify(paused));
      }
    } catch {
      localStorage.removeItem('timegarden.focusTimer');
    }
    logout();
    onLogout?.();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-20 backdrop-blur bg-white/90 border-b shadow-sm ${
      isAdmin ? 'border-purple-200' : 'border-emerald-100'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 h-16">
        <Link to={role === 'admin' ? '/admin/dashboard' : '/'} className="flex items-center gap-3 group shrink-0">
          <div
            className={`h-10 w-10 rounded-xl grid place-items-center text-white shadow-md ${
              isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-400' : 'bg-gradient-to-br from-emerald-500 to-sky-400'
            }`}
          >
            <SparklesIcon className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-slate-900 whitespace-nowrap">TimeGarden <span className="text-slate-400 font-normal">时光花园</span></p>
        </Link>
        <nav className="flex items-center justify-end gap-1.5 text-sm whitespace-nowrap min-w-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                  isActive
                    ? isAdmin
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-2 pr-2">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-slate-800">{profile?.nickname || profile?.user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold shadow ${
                isAdmin ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden xl:inline">退出</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

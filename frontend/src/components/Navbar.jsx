import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../App.jsx';

export default function Navbar({ isAdmin, role, profile, onLogout }) {
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);

  const navItems = React.useMemo(() => {
    const common = [
      { path: '/', label: '仪表盘' },
      { path: '/tasks', label: '任务' },
      { path: '/garden', label: '花园' },
      { path: '/stats', label: '统计' },
      { path: '/profile', label: '个人中心' },
      { path: '/focus', label: '专注' },
    ];
    if (role === 'admin') {
      return [
        { path: '/admin/dashboard', label: '管理员仪表盘' },
        { path: '/admin/announcements', label: '公告管理' },
        ...common,
      ];
    }
    return common;
  }, [role]);

  const handleLogout = () => {
    logout();
    onLogout?.();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-20 backdrop-blur bg-white/90 border-b ${isAdmin ? 'border-purple-200' : 'border-emerald-100'} shadow-sm`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-400' : 'bg-gradient-to-br from-emerald-400 to-sky-400'} shadow-md`} />
          <div>
            <p className="text-lg font-semibold text-slate-900">TimeGarden 时光花园</p>
            <p className="text-xs text-slate-500">把时间种成一座小花园</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full font-medium transition ${
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{profile?.nickname || profile?.user?.username}</p>
              <p className="text-xs text-slate-500">{role === 'admin' ? '管理员' : '普通用户'}</p>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold shadow ${
                isAdmin ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              退出
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

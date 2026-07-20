import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { AuthContext } from '../App.jsx';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '', nickname: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickLoading, setQuickLoading] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register' && form.password !== form.confirm) {
        setError('两次密码不一致');
        setLoading(false);
        return;
      }
      if (mode === 'register') {
        const res = await api.post('/auth/register/', {
          username: form.username,
          password: form.password,
          nickname: form.nickname,
        });
        login(res.data.token, res.data.user);
        navigate('/');
        return;
      }
      const res = await api.post('/auth/login/', {
        username: form.username,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      if (res.data.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        const redirect = location.state?.from?.pathname || '/';
        navigate(redirect);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data?.detail === 'string' ? data.detail : '无法连接服务器，请确认 Django 后端已在 8000 端口启动。');
    } finally {
      setLoading(false);
    }
  };

  const quickAccess = async (account) => {
    setQuickLoading(account.role);
    setError('');
    setForm({ username: account.username, password: account.password, confirm: '', nickname: '' });
    try {
      const res = await api.post('/auth/login/', { username: account.username, password: account.password });
      login(res.data.token, res.data.user);
      navigate(res.data.user?.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err) {
      setError('测试账号登录失败，请先在后端执行 py -3 manage.py migrate。');
    } finally {
      setQuickLoading('');
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-panel">
        <aside className="login-brand">
          <div className="space-y-4">
            <div className="login-logo">TG</div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/75">TimeGarden</p>
            <h1 className="text-4xl font-bold tracking-tight">种下时间，<br />收获专注。</h1>
            <p className="text-white/80 leading-relaxed text-sm">规划今天的任务，完成一轮专注，让每一分钟在花园里留下痕迹。</p>
          </div>
          {import.meta.env.DEV && <div className="space-y-3">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quickAccess({ username: 'demo_user', password: 'timegarden123', role: 'user' })} disabled={quickLoading} className="login-demo-button">
                <span>普通用户</span><small>demo_user</small>
              </button>
              <button onClick={() => quickAccess({ username: 'demo_admin', password: 'admin123456', role: 'admin' })} disabled={quickLoading} className="login-demo-button">
                <span>管理员</span><small>demo_admin</small>
              </button>
            </div>
          </div>}
        </aside>
        <main className="login-form-side">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">欢迎回来</p>
              <h2 className="text-2xl font-semibold text-slate-900">{mode === 'login' ? '登录账户' : '创建账户'}</h2>
            </div>
            <div className="bg-slate-100 rounded-full p-1 text-sm flex items-center">
              <button
                onClick={() => setMode('login')}
                className={`px-3 py-1 rounded-full ${mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                登录
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-3 py-1 rounded-full ${mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                注册
              </button>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-600">账号</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="请输入账号"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="请输入密码"
                required
              />
            </div>
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-sm text-slate-600">确认密码</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="再次输入密码"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">昵称</label>
                  <input
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="花园昵称"
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>
          {import.meta.env.DEV && <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            普通用户：demo_user / timegarden123<br />管理员：demo_admin / admin123456
          </div>}
        </main>
      </div>
    </div>
  );
}

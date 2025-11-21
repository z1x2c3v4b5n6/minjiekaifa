import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { AuthContext } from '../App.jsx';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '', nickname: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        // RegisterView 期望的字段：username、password，可选 nickname / role
        await api.post('/auth/register/', {
          username: form.username,
          password: form.password,
          nickname: form.nickname,
          role: 'user',
        });
      }
      const res = await api.post('/auth/login/', {
        username: form.username,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      const redirect = location.state?.from?.pathname || '/';
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const quickAccess = async (type) => {
    const username = type === 'admin' ? 'admin_demo' : 'demo_user';
    const password = 'timegarden123';
    const nickname = type === 'admin' ? 'Admin 管理员' : '花园友人';
    const role = type === 'admin' ? 'admin' : 'user';
    setForm({ username, password, confirm: password, nickname });
    setMode('login');
    try {
      await api.post('/auth/register/', { username, password, nickname, role });
    } catch (e) {
      // ignore duplicate
    }
    try {
      const res = await api.post('/auth/login/', { username, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError('快速登录失败，请手动注册');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4">
      <div className="card w-full max-w-5xl overflow-hidden grid md:grid-cols-5">
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-400 to-sky-500 text-white p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em]">TimeGarden</p>
            <h1 className="text-3xl font-bold">时光花园</h1>
            <p className="text-white/90 leading-relaxed">专注每一刻，把时间种成小小花园。番茄是种子，专注是阳光。</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">一键体验</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => quickAccess('user')}
                className="w-full bg-white/90 text-emerald-700 font-semibold rounded-xl px-4 py-3 hover:bg-white"
              >
                普通用户体验账号
              </button>
              <button
                onClick={() => quickAccess('admin')}
                className="w-full bg-white/90 text-indigo-700 font-semibold rounded-xl px-4 py-3 hover:bg-white"
              >
                管理员体验账号
              </button>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 p-8 bg-white">
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
          <p className="text-xs text-slate-400 mt-4">建议先点击左侧一键体验，会自动创建并登录演示账号。</p>
        </div>
      </div>
    </div>
  );
}

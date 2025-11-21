import React, { useContext, useEffect, useState } from 'react';
import api from '../api.js';
import { AuthContext } from '../App.jsx';

export default function ProfilePage({ isAdmin }) {
  const { profile, setProfile } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleSave = async () => {
    const res = await api.put('/profile/', form);
    setProfile(res.data);
    setMessage('保存成功');
    setTimeout(() => setMessage(''), 2000);
  };

  if (!form) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">个人中心</p>
        <h1 className="text-3xl font-bold text-slate-900">资料与偏好</h1>
        <p className="text-slate-500 mt-1">让系统更懂你。</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">基本资料</p>
              <p className="text-lg font-semibold text-slate-900">昵称 / 签名 / 头像</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isAdmin ? '管理员' : '普通用户'}
            </span>
          </div>
          <div>
            <label className="text-sm text-slate-600">昵称</label>
            <input
              value={form.nickname || ''}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">头像 URL</label>
            <input
              value={form.avatar || ''}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">签名</label>
            <textarea
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <p className="text-lg font-semibold text-slate-900">偏好设置</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">默认专注时长（分钟）</label>
              <input
                type="number"
                value={form.default_focus_minutes || 25}
                onChange={(e) => setForm({ ...form, default_focus_minutes: Number(e.target.value) })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">默认短休（分钟）</label>
              <input
                type="number"
                value={form.default_short_break_minutes || 5}
                onChange={(e) => setForm({ ...form, default_short_break_minutes: Number(e.target.value) })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">默认长休（分钟）</label>
              <input
                type="number"
                value={form.default_long_break_minutes || 15}
                onChange={(e) => setForm({ ...form, default_long_break_minutes: Number(e.target.value) })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">默认环境音</label>
              <select
                value={form.default_scene || 'rain'}
                onChange={(e) => setForm({ ...form, default_scene: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="rain">Rain 雨声</option>
                <option value="sea">Sea 海浪</option>
                <option value="cafe">Cafe 咖啡馆</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`px-5 py-3 rounded-xl text-white font-semibold shadow ${isAdmin ? 'bg-purple-500 hover:bg-purple-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            保存设置
          </button>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

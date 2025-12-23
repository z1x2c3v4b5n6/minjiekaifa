import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ nickname: '', default_focus_minutes: 25, default_short_break_minutes: 5, default_long_break_minutes: 15, default_scene: 'rain' });
  const [saving, setSaving] = useState(false);
  const [sounds, setSounds] = useState([]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/');
      setProfile(res.data);
      setForm({
        nickname: res.data.nickname || '',
        default_focus_minutes: res.data.default_focus_minutes,
        default_short_break_minutes: res.data.default_short_break_minutes,
        default_long_break_minutes: res.data.default_long_break_minutes,
        default_scene: res.data.default_scene,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    api.get('/sounds/').then((res) => setSounds(res.data));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/profile/', form);
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-slate-500">个人中心</p>
        <h1 className="text-2xl font-semibold text-slate-900">账户与偏好</h1>
      </div>

      {!profile ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold">
                {profile.nickname?.[0] || profile.username?.[0] || 'U'}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{profile.nickname || profile.username}</p>
                <p className="text-sm text-slate-500">角色：{profile.role === 'admin' ? '管理员' : '普通用户'}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>账号：{profile.username}</p>
              <p>默认场景：{profile.default_scene}</p>
            </div>
          </div>

          <div className="lg:col-span-2 card p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">专注 & 场景设置</h3>
            <form className="space-y-3" onSubmit={saveProfile}>
              <div>
                <label className="text-sm text-slate-600">昵称</label>
                <input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-slate-600">默认专注</label>
                  <input
                    type="number"
                    value={form.default_focus_minutes}
                    onChange={(e) => setForm({ ...form, default_focus_minutes: Number(e.target.value) })}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">短休息</label>
                  <input
                    type="number"
                    value={form.default_short_break_minutes}
                    onChange={(e) => setForm({ ...form, default_short_break_minutes: Number(e.target.value) })}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">长休息</label>
                  <input
                    type="number"
                    value={form.default_long_break_minutes}
                    onChange={(e) => setForm({ ...form, default_long_break_minutes: Number(e.target.value) })}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">默认环境音</label>
                <select
                  value={form.default_scene}
                  onChange={(e) => setForm({ ...form, default_scene: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="none">无声</option>
                  {sounds.map((sound) => (
                    <option key={sound.key} value={sound.key}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

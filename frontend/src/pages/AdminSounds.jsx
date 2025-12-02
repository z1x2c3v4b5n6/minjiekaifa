import React, { useEffect, useState } from 'react';
import { CheckBadgeIcon, CloudArrowUpIcon, MusicalNoteIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

export default function AdminSounds() {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', file: null, file_url: '', is_published: true });
  const [error, setError] = useState('');

  const fetchSounds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sounds/');
      setSounds(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSounds();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('is_published', form.is_published);
    if (form.file) formData.append('file', form.file);
    if (form.file_url) formData.append('file_url', form.file_url);

    try {
      await api.post('/admin/sounds/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ name: '', file: null, file_url: '', is_published: true });
      fetchSounds();
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      const firstFieldError =
        data && typeof data === 'object' ? (Object.values(data)[0]?.[0] || Object.values(data)[0]) : '';
      setError(data?.detail || firstFieldError || '创建失败，请检查填写内容');
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (sound) => {
    try {
      await api.patch(`/admin/sounds/${sound.id}/`, { is_published: !sound.is_published });
      fetchSounds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (soundId) => {
    if (!window.confirm('确定要删除该音频吗？')) return;
    try {
      await api.delete(`/admin/sounds/${soundId}/`);
      setSounds((prev) => prev.filter((s) => s.id !== soundId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">声音资源管理</p>
          <h1 className="text-2xl font-semibold text-slate-900">环境音库</h1>
          <p className="text-slate-500 text-sm mt-1">上传或维护可供用户选择的环境音文件。</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 grid place-items-center">
          <MusicalNoteIcon className="h-6 w-6" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 card p-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CloudArrowUpIcon className="h-5 w-5" /> 新增音频
          </h3>
          <p className="text-xs text-slate-500 mt-1">支持上传本地文件或填写外链 URL，至少提供一个。</p>
          <form className="space-y-3 mt-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-600">音频名称</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="如：夏夜虫鸣"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">上传文件</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">或音频外链</label>
              <input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="https://"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              发布后用户可见
            </label>
            {error && <p className="text-sm text-amber-600">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="w-full px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600"
            >
              {creating ? '上传中...' : '确认添加'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">音频列表</h3>
            {loading && <span className="text-xs text-slate-400">刷新中...</span>}
          </div>
          <div className="space-y-3">
            {sounds.length === 0 && <p className="text-sm text-slate-500">暂无音频，请先添加。</p>}
            {sounds.map((sound) => (
              <div key={sound.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {sound.name}
                    {sound.is_published && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                        <CheckBadgeIcon className="h-4 w-4" /> 已发布
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">唯一键：{sound.key}</p>
                  <a className="text-xs text-blue-600" href={sound.url} target="_blank" rel="noreferrer">
                    试听 / 链接
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(sound)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                      sound.is_published ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    {sound.is_published ? '下线' : '发布'}
                  </button>
                  <button
                    onClick={() => handleDelete(sound.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

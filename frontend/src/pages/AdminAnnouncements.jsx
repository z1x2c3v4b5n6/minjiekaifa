import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, MegaphoneIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', is_published: false });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/admin/announcements/').then((res) => setAnnouncements(res.data.results || res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}/`, form);
      } else {
        await api.post('/admin/announcements/', form);
      }
      setForm({ title: '', content: '', is_published: false });
      setEditingId(null);
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, is_published: item.is_published });
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/announcements/${id}/`);
    if (editingId === id) {
      setEditingId(null);
      setForm({ title: '', content: '', is_published: false });
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-700">
          <MegaphoneIcon className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">公告管理</h1>
            <p className="text-sm text-slate-500">创建、发布或下线平台公告</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">公告列表</h2>
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {item.title}
                    {item.is_published && <CheckCircleIcon className="h-4 w-4 text-emerald-500" />}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {!announcements.length && <p className="text-sm text-slate-500 py-4">暂无公告</p>}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? '编辑公告' : '新建公告'}</h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-600">标题</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">内容</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                rows="4"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              发布
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow"
            >
              <PlusIcon className="h-5 w-5" />
              {loading ? '保存中...' : editingId ? '保存修改' : '创建公告'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

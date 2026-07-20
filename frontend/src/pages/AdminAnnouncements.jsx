import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, MegaphoneIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', is_published: false, is_important: false, expires_at: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

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
      const payload = { ...form, expires_at: form.expires_at || null };
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}/`, payload);
      } else {
        await api.post('/admin/announcements/', payload);
      }
      setForm({ title: '', content: '', is_published: false, is_important: false, expires_at: '' });
      setEditingId(null);
      setShowEditor(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, is_published: item.is_published, is_important: item.is_important, expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '' });
    setShowEditor(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', content: '', is_published: false, is_important: false, expires_at: '' });
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/announcements/${id}/`);
    if (editingId === id) {
      setEditingId(null);
      setForm({ title: '', content: '', is_published: false, is_important: false, expires_at: '' });
    }
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-600 grid place-items-center"><MegaphoneIcon className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">公告管理</h1>
            <p className="text-sm text-slate-500 mt-1">向用户发布产品动态和重要通知</p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-sm hover:bg-purple-700"><PlusIcon className="h-5 w-5" />新建公告</button>
      </div>

      <section className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100"><div><h2 className="text-lg font-semibold text-slate-900">全部公告</h2><p className="text-xs text-slate-400 mt-1">共 {announcements.length} 条</p></div><div className="flex gap-3 text-xs"><span className="text-emerald-600">已发布 {announcements.filter((item) => item.is_published).length}</span><span className="text-slate-400">草稿 {announcements.filter((item) => !item.is_published).length}</span></div></div>
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div key={item.id} className="py-5 flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {item.title}
                    {item.is_important && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">重要</span>}<span className={`text-xs px-2 py-0.5 rounded-full ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.is_published ? '已发布' : '草稿'}</span>
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-6">{item.content}</p>
                  <p className="text-xs text-slate-400 mt-2">创建于 {new Date(item.created_at).toLocaleString()} · 阅读 {item.read_count || 0} 人{item.expires_at ? ` · 有效至 ${new Date(item.expires_at).toLocaleString()}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
            {!announcements.length && <div className="py-20 text-center"><div className="mx-auto h-14 w-14 rounded-2xl bg-purple-50 text-purple-400 grid place-items-center"><MegaphoneIcon className="h-7 w-7" /></div><h3 className="mt-4 font-semibold text-slate-800">还没有公告</h3><p className="text-sm text-slate-400 mt-1">创建第一条公告，向用户传递重要信息</p><button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50"><PlusIcon className="h-4 w-4" />创建公告</button></div>}
          </div>
      </section>

      {showEditor && <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm grid place-items-center p-4" onMouseDown={() => setShowEditor(false)}>
        <div className="card p-6 w-full max-w-lg" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-5"><div><h2 className="text-xl font-semibold text-slate-900">{editingId ? '编辑公告' : '新建公告'}</h2><p className="text-sm text-slate-500 mt-1">保存为草稿，或立即向所有用户发布</p></div><button onClick={() => setShowEditor(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-600">标题</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">内容</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                rows="6"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              发布
            </label>
            <div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700"><input type="checkbox" checked={form.is_important} onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />重要公告</label><label className="text-sm text-slate-600">有效期（可选）<input type="datetime-local" value={form.expires_at || ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2" /></label></div>
            <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setShowEditor(false)} className="px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-600">取消</button><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-sm"><CheckCircleIcon className="h-5 w-5" />{loading ? '保存中...' : editingId ? '保存修改' : '创建公告'}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}

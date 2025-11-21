import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import api from '../api.js';

const statusOptions = [
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
];

const priorityOptions = [
  { value: 'normal', label: '普通' },
  { value: 'important', label: '重要' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    status: 'todo',
    priority: 'normal',
    deadline: '',
    estimated_pomodoros: '',
    is_today: false,
  });

  const fetchTasks = async (current = filter) => {
    setLoading(true);
    try {
      let query = '';
      if (current === 'today') query = '?filter=today';
      if (current === 'important') query = '?filter=important';
      if (current === 'done') query = '?status=done';
      const res = await api.get(`/tasks/${query}`);
      setTasks(res.data);
      setFilter(current);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        category: form.category,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        estimated_pomodoros: form.estimated_pomodoros || null,
        is_today: form.is_today,
      };
      await api.post('/tasks/', payload);
      setForm({ title: '', category: '', status: 'todo', priority: 'normal', deadline: '', estimated_pomodoros: '', is_today: false });
      fetchTasks(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const updateTask = async (id, payload) => {
    try {
      await api.patch(`/tasks/${id}/`, payload);
      fetchTasks(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleToday = async (task) => {
    try {
      await api.post(`/tasks/${task.id}/set_today/`);
      fetchTasks(filter);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">任务管理</p>
          <h1 className="text-2xl font-semibold text-slate-900">规划你的专注清单</h1>
        </div>
        <div className="flex gap-2 text-sm bg-slate-100 rounded-full p-1">
          {['all', 'today', 'important', 'done'].map((key) => (
            <button
              key={key}
              onClick={() => fetchTasks(key)}
              className={`px-3 py-1 rounded-full ${filter === key ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
            >
              {key === 'all' ? '全部' : key === 'today' ? '今日' : key === 'important' ? '重要' : '已完成'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">任务列表</h3>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="text-sm text-slate-500 py-4 text-center">加载中...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">暂无任务</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      {task.title}
                      {task.priority === 'important' && <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-600">重要</span>}
                      {task.is_today && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">今日</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      分类：{task.category || '未分类'} · 状态：{task.status} · 截止：
                      {task.deadline ? dayjs(task.deadline).format('MM-DD') : '无'} · 预计番茄：{task.estimated_pomodoros || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      value={task.status}
                      onChange={(e) => updateTask(task.id, { status: e.target.value })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateTask(task.id, { priority: task.priority === 'important' ? 'normal' : 'important' })}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {task.priority === 'important' ? '设为普通' : '设为重要'}
                    </button>
                    <button
                      onClick={() => toggleToday(task)}
                      className="px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      {task.is_today ? '移出今日' : '加入今日'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">新增任务</h3>
          <form className="space-y-3" onSubmit={createTask}>
            <div>
              <label className="text-sm text-slate-600">标题</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="例如：完成课程学习"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">分类</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="学习 / 工作"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">截止日期</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">状态</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">优先级</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">预计番茄数</label>
                <input
                  type="number"
                  min="1"
                  value={form.estimated_pomodoros}
                  onChange={(e) => setForm({ ...form, estimated_pomodoros: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mt-6">
                <input
                  type="checkbox"
                  checked={form.is_today}
                  onChange={(e) => setForm({ ...form, is_today: e.target.checked })}
                  className="rounded border-slate-300"
                />
                加入今日计划
              </label>
            </div>
            <button type="submit" className="w-full py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600">
              保存任务
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

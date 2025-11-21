import React, { useEffect, useState } from 'react';
import { AdjustmentsHorizontalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '完成', value: 'done' },
];

const categoryOptions = ['学习', '工作', '生活', '健康'];

export default function TasksPage({ isAdmin }) {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [form, setForm] = useState({ title: '', category: '', estimated_pomodoros: 1, status: 'todo' });
  const [loading, setLoading] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    api
      .get('/tasks/', { params: { ...filters, is_today: undefined } })
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const createTask = async () => {
    if (!form.title) return;
    await api.post('/tasks/', form);
    setForm({ title: '', category: '', estimated_pomodoros: 1, status: 'todo' });
    fetchTasks();
  };

  const updateTask = async (taskId, patch) => {
    await api.put(`/tasks/${taskId}/`, { ...patch });
    fetchTasks();
  };

  const deleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}/`);
    fetchTasks();
  };

  const toggleToday = async (taskId) => {
    await api.post(`/tasks/${taskId}/set_today/`);
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">任务管理</p>
          <h1 className="text-3xl font-bold text-slate-900">规划与安排</h1>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isAdmin ? '管理员视角：任务面板强化展示' : '普通视角：轻量任务列表'}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span className="text-sm">筛选</span>
          </div>
          <select
            className="rounded-full border border-slate-200 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-full border border-slate-200 px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">全部分类</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ status: '', category: '' })}
            className="text-sm px-3 py-2 rounded-full bg-slate-100 text-slate-600"
          >
            重置
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="任务标题"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="">分类（可选）</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.estimated_pomodoros}
            onChange={(e) => setForm({ ...form, estimated_pomodoros: Number(e.target.value) })}
            className="rounded-xl border border-slate-200 px-3 py-2"
            placeholder="预计番茄数"
          />
          <button
            onClick={createTask}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold px-4 py-2 shadow"
          >
            添加任务
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-slate-500">加载中...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-500">暂无任务，先创建一个吧。</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.category || '未分类'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : task.status === 'doing'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                }`}>
                  {task.status || 'todo'}
                </span>
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-3">
                <span className="bg-slate-100 px-3 py-1 rounded-full">预计 {task.estimated_pomodoros || 1} 🍅</span>
                <button
                  onClick={() => toggleToday(task.id)}
                  className={`text-xs px-3 py-1 rounded-full border ${task.is_today ? 'border-emerald-400 text-emerald-600' : 'border-slate-200 text-slate-500'}`}
                >
                  {task.is_today ? '今日已选' : '加入今日'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                  className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl px-3 py-2"
                >
                  {task.status === 'done' ? '标记未完成' : '标记完成'}
                </button>
                <button
                  onClick={() => updateTask(task.id, { status: 'doing' })}
                  className="flex-1 bg-sky-50 text-sky-600 rounded-xl px-3 py-2"
                >
                  进行中
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => updateTask(task.id, { title: `${task.title}` })}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  编辑
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    parent: '',
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
        parent: form.parent || null,
      };
      await api.post('/tasks/', payload);
      setForm({ title: '', category: '', status: 'todo', priority: 'normal', deadline: '', estimated_pomodoros: '', is_today: false, parent: '' });
      fetchTasks(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const updateTask = async (id, payload) => {
    try {
      if (payload.status === 'done') {
        try {
          await api.post(`/tasks/${id}/complete/`);
        } catch (error) {
          if (error.response?.status === 409 && window.confirm(`还有 ${error.response.data.open_subtasks} 个子任务未完成。是否同时完成所有子任务？`)) {
            await api.post(`/tasks/${id}/complete/`, { complete_subtasks: true });
          } else {
            throw error;
          }
        }
      } else {
        await api.patch(`/tasks/${id}/`, payload);
      }
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

  const moveTomorrow = async (task) => {
    await api.post(`/tasks/${task.id}/move_tomorrow/`);
    fetchTasks(filter);
  };

  const formatDeadline = (date) => {
    if (!date) return '无';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '无';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };
  const todayKey = new Date().toLocaleDateString('en-CA');
  const tomorrowKey = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');

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
                <div key={task.id} className="py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      {task.title}
                      {task.priority === 'important' && <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-600">重要</span>}
                      {task.scheduled_date === todayKey && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">今日</span>}
                      {task.scheduled_date === tomorrowKey && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">已安排明天</span>}
                      {task.scheduled_date && task.scheduled_date < todayKey && task.status !== 'done' && <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700">昨日遗留</span>}
                      {task.parent && <span className="px-2 py-0.5 text-xs rounded-full bg-sky-50 text-sky-700">子任务</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      分类：{task.category || '未分类'} · 状态：{task.status} · 截止：
                      {formatDeadline(task.deadline)} · 预计番茄：{task.estimated_pomodoros || '-'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, ((task.completed_pomodoros || 0) / (task.estimated_pomodoros || 1)) * 100)}%` }} /></div>
                      <span className="text-xs text-slate-500">{task.completed_pomodoros || 0}/{task.estimated_pomodoros || '-'} 番茄 · {task.actual_focus_minutes || 0} 分钟</span>
                      {task.estimate_variance > 0 && <span className="text-xs text-amber-600">超出预计 {task.estimate_variance} 个</span>}
                      {task.subtask_count > 0 && <span className="text-xs text-slate-400">子任务 {task.completed_subtask_count}/{task.subtask_count}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap xl:justify-end">
                    {task.status !== 'done' && <Link to={`/focus?task=${task.id}`} className="px-3 py-1 rounded-full bg-sky-100 text-sky-700">开始专注</Link>}
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
                    {task.status !== 'done' && task.scheduled_date !== tomorrowKey && <button onClick={() => moveTomorrow(task)} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100">移到明天</button>}
                    <button
                      onClick={() => toggleToday(task)}
                      className="px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      {task.scheduled_date === todayKey ? '移出今日' : '加入今日'}
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
            <div>
              <label className="text-sm text-slate-600">所属父任务（可选）</label>
              <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2">
                <option value="">无，创建独立任务</option>
                {tasks.filter((task) => !task.parent && task.status !== 'done').map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
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

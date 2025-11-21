import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import api from '../api.js';
import PomodoroTimer from '../components/PomodoroTimer.jsx';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今日' },
  { key: 'important', label: '重要' },
  { key: 'done', label: '已完成' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ today_minutes: 0, today_sessions: 0, streak_days: 0 });
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/today/');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async (tab = activeTab) => {
    setLoadingTasks(true);
    try {
      let query = '';
      if (tab === 'today') query = '?filter=today';
      if (tab === 'important') query = '?filter=important';
      if (tab === 'done') query = '?status=done';
      const res = await api.get(`/tasks/${query}`);
      setTasks(res.data);
      setActiveTab(tab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTasks('today');
  }, []);

  const toggleToday = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/set_today/`);
      fetchTasks(activeTab);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (taskId, status) => {
    try {
      const next = status === 'done' ? 'todo' : 'done';
      await api.patch(`/tasks/${taskId}/`, { status: next });
      fetchTasks(activeTab);
    } catch (err) {
      console.error(err);
    }
  };

  const today = dayjs().format('YYYY 年 MM 月 DD 日');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h1 className="text-2xl font-semibold text-slate-900">欢迎回来，专注每一刻</h1>
        </div>
        <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">连续专注 {stats.streak_days} 天</div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="今日番茄次数" value={stats.today_sessions} suffix="次" gradient="from-orange-400 to-amber-500" />
        <StatCard title="今日专注分钟数" value={stats.today_minutes} suffix="分钟" gradient="from-emerald-400 to-sky-400" />
        <StatCard title="连续专注天数" value={stats.streak_days} suffix="天" gradient="from-indigo-400 to-purple-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-500">今日计划</p>
              <h3 className="text-lg font-semibold text-slate-900">任务列表</h3>
            </div>
            <div className="flex items-center gap-2 text-sm bg-slate-100 rounded-full p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => fetchTasks(tab.key)}
                  className={`px-3 py-1 rounded-full ${activeTab === tab.key ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loadingTasks ? (
              <p className="text-sm text-slate-500 py-6 text-center">加载中...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">暂无任务</p>
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
                      {task.deadline ? `截止 ${task.deadline}` : '无截止日期'} · 状态：{task.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => toggleToday(task.id)}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {task.is_today ? '移出今日' : '加入今日'}
                    </button>
                    <button
                      onClick={() => toggleStatus(task.id, task.status)}
                      className="px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      {task.status === 'done' ? '标记未完成' : '标记完成'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <PomodoroTimer tasks={tasks} onSessionLogged={() => fetchStats()} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix, gradient }) {
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-semibold text-slate-900">
          {value}
          <span className="text-base text-slate-500 ml-1">{suffix}</span>
        </p>
      </div>
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} text-white grid place-items-center font-bold`}>{'↻'}</div>
    </div>
  );
}

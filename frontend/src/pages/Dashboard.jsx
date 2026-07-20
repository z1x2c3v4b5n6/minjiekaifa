import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [announcements, setAnnouncements] = useState([]);
  const [planContext, setPlanContext] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => localStorage.getItem('timegarden.onboardingDone') === 'true');

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
    api.get('/announcements/').then((res) => setAnnouncements(res.data.results || res.data));
    api.get('/reviews/context/').then((res) => setPlanContext(res.data));
  }, []);

  useEffect(() => {
    if (!selectedAnnouncement) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedAnnouncement(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedAnnouncement]);

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

  const openAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.is_read) {
      try {
        await api.post(`/announcements/${announcement.id}/read/`);
        setAnnouncements((items) => items.map((item) => item.id === announcement.id ? { ...item, is_read: true } : item));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayKey = new Date().toLocaleDateString('en-CA');

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

      {planContext?.has_review_context && (
        <div className="card p-5 border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase">昨日复盘 · 今日行动</p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">{planContext.priority || '按计划完成今天的专注目标'}</h2>
            <p className="text-sm text-slate-500 mt-1">目标 {planContext.planned_pomodoros} 个番茄，已完成 {planContext.completed_pomodoros} 个，还剩 {planContext.remaining_pomodoros} 个</p>
          </div>
          <Link to="/focus" className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600">开始下一轮</Link>
        </div>
      )}

      {!onboardingDismissed && tasks.length === 0 && (
        <div className="card p-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase">第一次使用</p><h2 className="text-xl font-semibold mt-1">用三步种下第一棵专注植物</h2></div><button onClick={() => { localStorage.setItem('timegarden.onboardingDone', 'true'); setOnboardingDismissed(true); }} className="text-sm text-slate-400">跳过</button></div>
          <div className="grid md:grid-cols-3 gap-3 mt-5">{['创建第一个任务', '加入今日计划', '开始第一次专注'].map((label, index) => <div key={label} className="rounded-xl bg-white/80 p-4"><span className="text-xs font-bold text-emerald-600">0{index + 1}</span><p className="font-medium text-slate-800 mt-2">{label}</p></div>)}</div>
          <Link to="/tasks" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold">创建任务</Link>
        </div>
      )}

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
                      {task.scheduled_date === todayKey && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">今日</span>}
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
                      {task.scheduled_date === todayKey ? '移出今日' : '加入今日'}
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
          <div className="card p-4 mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">系统公告</p>
                <h3 className="text-lg font-semibold text-slate-900">最新通知</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-600">未读 {announcements.filter((item) => !item.is_read).length}</span>
            </div>
            {announcements.slice(0, 3).map((a) => (
              <button type="button" onClick={() => openAnnouncement(a)} key={a.id} className="group w-full p-3 rounded-lg bg-slate-50 border border-slate-100 text-left hover:bg-emerald-50 hover:border-emerald-200 transition">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-900 truncate flex items-center gap-2">{!a.is_read && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}{a.is_important && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">重要</span>}{a.title}</p><p className="text-sm text-slate-600 line-clamp-2 mt-1">{a.content}</p><p className="text-xs text-slate-400 mt-2">{new Date(a.created_at).toLocaleString()}</p></div><ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-1" /></div>
              </button>
            ))}
            {!announcements.length && <p className="text-sm text-slate-500">暂无公告</p>}
          </div>
        </div>
      </div>
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm grid place-items-center p-4" onMouseDown={() => setSelectedAnnouncement(null)} role="presentation">
          <article role="dialog" aria-modal="true" aria-labelledby="announcement-title" className="card w-full max-w-xl p-6" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center shrink-0"><MegaphoneIcon className="h-5 w-5" /></div><div><p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">系统公告</p><h2 id="announcement-title" className="text-xl font-semibold text-slate-900 mt-1">{selectedAnnouncement.title}</h2></div></div><button onClick={() => setSelectedAnnouncement(null)} aria-label="关闭公告" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><XMarkIcon className="h-5 w-5" /></button></div>
            <div className="mt-5 pt-5 border-t border-slate-100"><p className="text-slate-700 leading-7 whitespace-pre-wrap break-words">{selectedAnnouncement.content}</p></div>
            <div className="mt-6 flex items-center justify-between"><time className="text-xs text-slate-400">发布于 {new Date(selectedAnnouncement.created_at).toLocaleString()}</time><button onClick={() => setSelectedAnnouncement(null)} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">我知道了</button></div>
          </article>
        </div>
      )}
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

import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../App.jsx';
import api from '../api.js';
import PomodoroTimer from '../components/PomodoroTimer.jsx';
import StatsCard from '../components/StatsCard.jsx';
import TodayTaskList from '../components/TodayTaskList.jsx';

export default function PersonalDashboard() {
  const { profile } = useContext(AuthContext);
  const [todayStats, setTodayStats] = useState({ today_minutes: 0, today_sessions: 0 });
  const [todayTasks, setTodayTasks] = useState([]);

  const fetchTodayStats = () => {
    api.get('/stats/today/').then((res) => setTodayStats(res.data));
  };

  const fetchTodayTasks = () => {
    api.get('/tasks/', { params: { is_today: true } }).then((res) => setTodayTasks(res.data));
  };

  useEffect(() => {
    fetchTodayStats();
    fetchTodayTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">欢迎回来，{profile?.nickname || profile?.user?.username}</p>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            今日概览
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">个人模式</span>
          </h1>
          <p className="text-slate-500 mt-1">保持节奏，专注让花园变得更茂盛。</p>
        </div>
        <Link to="/focus" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg">
          <FireIcon className="h-5 w-5" /> 全屏专注模式
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatsCard
          title="今日番茄"
          value={`${todayStats.today_sessions} 次`}
          sub="完成一次专注就是一次收获"
          icon={<SparklesIcon className="h-6 w-6" />}
          accent="emerald"
        />
        <StatsCard
          title="今日专注"
          value={`${todayStats.today_minutes} 分钟`}
          sub="持续专注，让花园更茂盛"
          icon={<FireIcon className="h-6 w-6" />}
          accent="blue"
        />
        <StatsCard
          title="场景偏好"
          value={profile?.default_scene || 'rain'}
          sub="在喜欢的场景里更易进入心流"
          icon={<ChartBarIcon className="h-6 w-6" />}
          accent="emerald"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TodayTaskList
          onSelectTask={(task) => {
            setTodayTasks((prev) => prev.map((t) => ({ ...t, selected: t.id === task.id })));
          }}
        />
        <PomodoroTimer
          tasks={todayTasks}
          defaultMinutes={profile?.default_focus_minutes || 25}
          onSessionLogged={() => {
            fetchTodayStats();
            fetchTodayTasks();
          }}
        />
      </div>
    </div>
  );
}

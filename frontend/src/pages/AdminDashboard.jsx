import React, { useEffect, useState } from 'react';
import { ChartBarIcon, MegaphoneIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../api.js';
import StatsCard from '../components/StatsCard.jsx';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({
    total_users: 0,
    total_focus_minutes: 0,
    today_focus_minutes: 0,
    today_sessions: 0,
    top_scene: '',
    today_plan_users: 0,
  });
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get('/admin/overview/').then((res) => setOverview(res.data));
    api.get('/admin/users/').then((res) => setUsers(res.data.results || res.data));
    api.get('/announcements/').then((res) => setAnnouncements(res.data.results || res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">欢迎回来，管理员</p>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            平台级仪表盘
            <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">ADMIN MODE</span>
          </h1>
          <p className="text-slate-500 mt-1">洞察全站数据，帮助用户更好地专注。</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatsCard
          title="今日番茄"
          value={`${overview.today_sessions} 次`}
          sub="全站今日完成的专注次数"
          icon={<SparklesIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="今日专注"
          value={`${overview.today_focus_minutes} 分钟`}
          sub="全站今日专注总时长"
          icon={<ChartBarIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="累计专注"
          value={`${overview.total_focus_minutes} 分钟`}
          sub="历史总专注时长"
          icon={<SparklesIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="注册用户"
          value={`${overview.total_users} 人`}
          sub="平台累计用户数"
          icon={<UsersIcon className="h-6 w-6" />}
          accent="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-purple-500" /> 用户概览
            </h2>
            <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Top 5</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(users || []).slice(0, 5).map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{u.nickname || u.username}</p>
                  <p className="text-xs text-slate-500">加入时间：{new Date(u.date_joined).toLocaleDateString()}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-700">番茄：{u.total_sessions || 0}</p>
                  <p className="text-slate-500">专注：{u.total_focus_minutes || 0} 分钟</p>
                </div>
              </div>
            ))}
            {!users.length && <p className="text-sm text-slate-500 py-4">暂无用户数据</p>}
          </div>
        </div>
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-purple-700">
            <MegaphoneIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-slate-900">公告</h2>
          </div>
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-600 line-clamp-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!announcements.length && <p className="text-sm text-slate-500">暂无发布的公告</p>}
          <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
            <p>场景偏好：{overview.top_scene || '暂无数据'}</p>
            <p>今日计划任务的用户：{overview.today_plan_users} 人</p>
          </div>
        </div>
      </div>
    </div>
  );
}

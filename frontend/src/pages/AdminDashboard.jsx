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
    today_active_users: 0,
    today_interrupted_sessions: 0,
  });
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get('/admin/overview/').then((res) => setOverview(res.data));
    api.get('/admin/users/').then((res) => setUsers(res.data.results || res.data));
    api.get('/announcements/').then((res) => setAnnouncements(res.data.results || res.data));
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">欢迎回来，管理员</p>
          <h1 className="text-3xl font-bold text-slate-900">平台概览</h1>
          <p className="text-slate-500 mt-2">关注用户活跃与专注趋势，内容管理从顶部导航进入。</p>
        </div>
      </div>

      <section className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">关键数据</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard
          title="今日番茄"
          value={`${overview.today_sessions} 次`}
          icon={<SparklesIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="今日专注"
          value={`${overview.today_focus_minutes} 分钟`}
          icon={<ChartBarIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="累计专注"
          value={`${overview.total_focus_minutes} 分钟`}
          icon={<SparklesIcon className="h-6 w-6" />}
          accent="purple"
        />
        <StatsCard
          title="今日活跃用户"
          value={`${overview.today_active_users} 人`}
          icon={<UsersIcon className="h-6 w-6" />}
          accent="purple"
        />
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">运营概况</p>
        <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 card p-6 space-y-5">
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
            {!users.length && <div className="py-12 text-center"><p className="text-sm font-medium text-slate-600">暂无活跃用户数据</p><p className="text-xs text-slate-400 mt-1">用户完成专注后将在这里展示</p></div>}
          </div>
        </div>
        <div className="card p-6 space-y-4">
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
            <p>今日中断专注：{overview.today_interrupted_sessions} 次</p>
            <p>平台注册用户：{overview.total_users} 人</p>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}

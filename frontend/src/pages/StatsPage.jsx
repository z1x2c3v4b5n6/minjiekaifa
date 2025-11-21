import React, { useEffect, useState } from 'react';
import api from '../api.js';

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((item) => {
        const height = (item.total / max) * 100;
        const day = new Date(item.day).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        return (
          <div key={item.day} className="flex-1 text-center text-xs text-slate-500">
            <div className="bg-gradient-to-t from-emerald-200 to-sky-300 rounded-t-xl" style={{ height: `${height}%` }} />
            <p className="mt-2">{day}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage({ isAdmin }) {
  const [stats, setStats] = useState({ daily: [], category_stats: {} });
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    api.get('/stats/overview/').then((res) => setStats(res.data));
    api.get('/moods/recent/?days=10').then((res) => setMoods(res.data));
  }, []);

  const categories = Object.entries(stats.category_stats || {});

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">统计 & 情绪</p>
        <h1 className="text-3xl font-bold text-slate-900">最近一周的专注轨迹</h1>
        <p className="text-slate-500 mt-1">看见趋势，找到属于你的节奏。</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-semibold text-slate-900">最近 7 天专注时长</p>
          <p className="text-xs text-slate-500">分钟数统计</p>
        </div>
        <BarChart data={stats.daily} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-semibold text-slate-900">按分类统计</p>
          <p className="text-xs text-slate-500">以专注分钟数衡量</p>
        </div>
        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无分类数据</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {categories.map(([category, minutes]) => (
              <div key={category} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{category}</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{minutes} 分钟</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <p className="text-lg font-semibold text-slate-900 mb-4">情绪 / 日记 时间轴</p>
        {moods.length === 0 ? (
          <p className="text-slate-500 text-sm">最近还没有情绪记录。</p>
        ) : (
          <div className="space-y-3">
            {moods.map((item) => (
              <div key={item.date} className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {item.mood}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.date}</p>
                  <p className="text-sm text-slate-600">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

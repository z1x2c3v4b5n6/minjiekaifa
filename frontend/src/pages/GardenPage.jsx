import React, { useEffect, useState } from 'react';
import { SparklesIcon, SunIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

export default function GardenPage({ isAdmin }) {
  const [data, setData] = useState({ total_pomodoros: 0, weekly_pomodoros: 0, category_stats: {}, level: '种子' });

  useEffect(() => {
    api.get('/garden/overview/').then((res) => setData(res.data));
  }, []);

  const categories = Object.entries(data.category_stats || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">花园视图</p>
          <h1 className="text-3xl font-bold text-slate-900">专注的花园长势</h1>
          <p className="text-slate-500 mt-1">每一次专注，都会让这座花园更茂盛。</p>
        </div>
        <span className={`px-3 py-2 rounded-full text-sm font-semibold ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
          等级：{data.level}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">总番茄数</p>
            <p className="text-2xl font-semibold text-slate-900">{data.total_pomodoros}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <SunIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">本周番茄数</p>
            <p className="text-2xl font-semibold text-slate-900">{data.weekly_pomodoros}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">成长等级</p>
            <p className="text-2xl font-semibold text-slate-900">{data.level}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">分类花坛</p>
            <p className="text-lg font-semibold text-slate-900">每个分类的成长程度</p>
          </div>
          <p className="text-xs text-slate-500">分钟越多，进度条越长。</p>
        </div>
        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无分类数据，完成带分类的任务试试看。</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map(([category, minutes]) => (
              <div key={category} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{category}</p>
                  <p className="text-xs text-slate-500">{minutes} 分钟</p>
                </div>
                <div className="w-full h-3 bg-white rounded-full border border-slate-100 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isAdmin ? 'bg-gradient-to-r from-purple-400 to-sky-400' : 'bg-gradient-to-r from-emerald-400 to-sky-400'}`}
                    style={{ width: `${Math.min(100, (minutes / 300) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

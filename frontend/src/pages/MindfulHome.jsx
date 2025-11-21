import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const localFallback = {
  greeting: { label: '夜深了', headline: '放松入睡，让大脑休息' },
  quick_actions: [
    { title: '心流专注', action: 'focus', badge: '25min', icon: 'sparkles' },
    { title: '睡眠监测', action: 'sleep-track', badge: '分析', icon: 'moon' },
    { title: '小憩一下', action: 'nap', badge: '10-20min', icon: 'sun' },
    { title: '呼吸法', action: 'breath', badge: '4-7-8', icon: 'wind' },
  ],
  sections: [
    {
      title: '助眠冥想',
      items: [
        {
          id: 101,
          title: '海浪入睡引导',
          duration: '12:30',
          cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 102,
          title: '松弛扫描',
          duration: '8:20',
          cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      title: '平复情绪',
      items: [
        {
          id: 201,
          title: '情绪调频',
          duration: '6:45',
          cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 202,
          title: '舒展拉伸',
          duration: '9:10',
          cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
  ],
};

export default function MindfulHome() {
  const [data, setData] = useState(localFallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/wellness/home/')
      .then((res) => setData(res.data))
      .catch(() => setData(localFallback))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 text-white p-8 shadow-xl flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-80">{data.greeting?.label || '此刻'}</p>
            <h1 className="text-3xl font-bold mt-1">{data.greeting?.headline || '关照身心，让睡眠更轻盈'}</h1>
            <p className="text-sm mt-2 text-white/80">精选冥想 · 睡眠故事 · 环境声音，一键进入心流与安睡模式</p>
          </div>
          <Link
            to="/sleep"
            className="px-4 py-3 bg-white/20 rounded-full font-semibold text-sm backdrop-blur hover:bg-white/30 transition"
          >
            去睡眠专区
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.quick_actions?.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/15 p-4 shadow-inner border border-white/20">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-white/80 mt-1">{item.badge}</p>
              <p className="text-[11px] text-white/70 mt-2">快速进入 {item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {data.sections?.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              <Link to="/meditation" className="text-sm text-indigo-600 hover:underline">
                更多
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.items.map((item) => (
                <Link
                  to={`/sleep/${item.id}`}
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition group"
                >
                  <div
                    className="h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.cover})` }}
                  />
                  <div className="p-3 space-y-1">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.duration} · 音频课程</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-center text-sm text-slate-500">加载中...</p>}
    </div>
  );
}

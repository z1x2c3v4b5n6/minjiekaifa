import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const initialTags = ['推荐', '睡眠故事', '助眠冥想', '睡眠声音', '免费'];

const defaultItems = [
  {
    id: 1,
    title: '星空下的鲸歌',
    duration: '18:40',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    tags: ['睡眠故事', '自然'],
    category: '睡眠故事',
  },
  {
    id: 2,
    title: '森林萤火晚安曲',
    duration: '14:15',
    cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    tags: ['助眠冥想', '自然'],
    category: '助眠冥想',
  },
];

export default function SleepPage() {
  const [tag, setTag] = useState('推荐');
  const [items, setItems] = useState(defaultItems);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/sleep/stories/', { params: { tag } })
      .then((res) => {
        setItems(res.data.items || defaultItems);
        setRecent(res.data.recent || []);
      })
      .catch(() => {
        setItems(defaultItems);
        setRecent(defaultItems.slice(0, 1));
      })
      .finally(() => setLoading(false));
  }, [tag]);

  const groupedSections = useMemo(() => {
    const map = {};
    (items || []).forEach((item) => {
      const key = item.category || '推荐';
      map[key] = map[key] || [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-800 text-white rounded-3xl p-8 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-white/70">睡眠 · 冥想 · 声音</p>
            <h1 className="text-3xl font-bold mt-1">今晚一起好好睡觉</h1>
            <p className="text-sm text-white/70 mt-2">精选故事、助眠冥想、睡眠工具和你常听的声音</p>
          </div>
          <Link
            to="/mindful"
            className="px-4 py-2 bg-white/15 rounded-full text-sm font-semibold hover:bg-white/25 transition"
          >
            返回正念首页
          </Link>
        </div>
        <div className="flex gap-2 overflow-auto pt-2">
          {initialTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                t === tag ? 'bg-white text-slate-900 shadow' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {Object.entries(groupedSections).map(([section, list]) => (
            <div key={section} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{section}</h2>
                <span className="text-xs text-slate-500">{list.length} 个内容</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {list.map((item) => (
                  <Link
                    to={`/sleep/${item.id}`}
                    key={item.id}
                    className="group rounded-xl overflow-hidden border border-slate-100 hover:shadow-md transition"
                  >
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${item.cover})` }} />
                    <div className="p-3 space-y-1">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.duration} · {item.tags?.join(' / ')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900">睡眠工具</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>· 睡眠监测：记录今夜睡眠时长与深浅</p>
              <p>· 小憩一下：10-20 分钟快速补能</p>
              <p>· 睡眠报告：查看一周趋势</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900">最近 / 收藏</h3>
            {recent?.length === 0 && <p className="text-sm text-slate-500">暂无记录</p>}
            <div className="space-y-2">
              {recent?.map((item) => (
                <Link key={item.id} to={`/sleep/${item.id}`} className="flex items-center gap-3 group">
                  <div
                    className="h-12 w-12 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.cover})` }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-sm text-slate-500">加载中...</p>}
    </div>
  );
}

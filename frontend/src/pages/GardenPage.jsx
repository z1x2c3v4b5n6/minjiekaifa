import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function GardenPage() {
  const [overview, setOverview] = useState(null);
  const [range, setRange] = useState('week');
  const [items, setItems] = useState([]);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/garden/overview/');
      setOverview(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    api
      .get(`/garden/items/?range=${range}`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err));
  }, [range]);

  const progress = overview ? Math.min(overview.current_exp / overview.next_level_exp, 1) : 0;
  const groupedByCategory = items.reduce((acc, item) => {
    const key = item.category || '未分类';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  const itemEmoji = (item) => {
    if (item.is_dead) return '🥀';
    if (item.item_type === 'flower') return '🌸';
    if (item.item_type === 'grass') return '🌿';
    return '🌳';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-slate-500">我的时光花园</p>
        <h1 className="text-2xl font-semibold text-slate-900">成长概览</h1>
      </div>

      <div className="card p-6">
        {!overview ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">当前阶段</p>
                <p className="text-xl font-semibold text-slate-900">
                  {overview.stage} · 等级 Lv.{overview.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">累计番茄</p>
                <p className="text-2xl font-semibold text-emerald-600">{overview.total_pomodoros}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>成长值 {overview.current_exp}</span>
                <span>下一等级 {overview.next_level_exp}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {["幼苗期", "成长期", "茂盛期"].map((stage, idx) => (
                <div key={stage} className={`p-3 rounded-xl border ${overview.stage === stage ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100'}`}>
                  <p className="text-sm text-slate-500">阶段 {idx + 1}</p>
                  <p className="font-semibold text-slate-900">{stage}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">专注可视化</p>
            <h2 className="text-xl font-semibold text-slate-900">我的花园</h2>
          </div>
          <div className="flex gap-2">
            {[
              { label: '日', value: 'day' },
              { label: '周', value: 'week' },
              { label: '月', value: 'month' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`px-3 py-1 rounded-full text-sm border ${range === option.value ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-slate-500 flex flex-wrap gap-4">
          <span>🌳 专注完成</span>
          <span>🥀 中断枯萎</span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">暂无花园记录，完成一次番茄会种下一颗树。</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
              <div key={category} className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">{category}</p>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-lg ${item.is_dead ? 'border-rose-200 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}
                    >
                      <span>{itemEmoji(item)}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

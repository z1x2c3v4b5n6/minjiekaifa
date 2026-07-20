import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function GardenPage() {
  const [overview, setOverview] = useState(null);
  const [range, setRange] = useState('day');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const stageMeta = {
    seedling: { icon: '🌱', label: '等待继续成长' },
    sprout: { icon: '🌿', label: '新芽' },
    growing: { icon: '🪴', label: '成长中' },
    bloom: { icon: '🌳', label: '盛放' },
  };

  const fetchOverview = async () => {
    try {
      const res = await api.get('/garden/overview/');
      setOverview(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.get('/garden/items/', { params: { range, date } });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [range, date]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-slate-500">我的时光花园</p>
        <h1 className="text-2xl font-semibold text-slate-900">专注花园</h1>
      </div>

      <div className="card p-6 space-y-4">
        {!overview ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500">总专注次数</p>
              <p className="text-2xl font-semibold text-slate-900">{overview.total_sessions}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500">完成次数</p>
              <p className="text-2xl font-semibold text-emerald-600">{overview.completed_count}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500">中断次数</p>
              <p className="text-2xl font-semibold text-amber-600">{overview.aborted_count}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500">连续天数</p>
              <p className="text-2xl font-semibold text-slate-900">{overview.streak_days}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">成长图鉴</h2>
        <p className="text-sm text-slate-500 mt-1">1–24 分钟长成新芽，25–44 分钟进入成长，45 分钟及以上盛放；中断记录会保留为可继续照料的幼苗。</p>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {Object.entries(stageMeta).map(([key, meta]) => <div key={key} className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 text-center"><div className="text-3xl">{meta.icon}</div><p className="text-xs text-slate-600 mt-2">{meta.label}</p></div>)}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">花园记录</p>
            <h2 className="text-lg font-semibold text-slate-900">按时间查看 Garden Items</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['day', 'week', 'month'].map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1 rounded-full text-sm border ${range === key ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
              >
                {key === 'day' ? '日' : key === 'week' ? '周' : '月'}
              </button>
            ))}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1 rounded-full text-sm border border-slate-200"
            />
          </div>
        </div>

        {loadingItems ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">暂无记录，开始一次专注吧。</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((item) => (
              <button type="button" onClick={() => setSelectedItem(item)} key={item.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between text-left hover:border-emerald-200 hover:bg-emerald-50/40 transition">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{stageMeta[item.growth_stage]?.icon || '🌱'}</span>
                  <div>
                  <p className="font-semibold text-slate-900">{item.task_title || item.category || '自由专注'}</p>
                  <p className="text-xs text-slate-500">{item.date} · {item.duration_minutes} 分钟 · {item.category || '未分类'}</p>
                  <p className="text-xs text-slate-400 mt-1">{stageMeta[item.growth_stage]?.label}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${item.is_dead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {item.is_dead ? '待照料' : '已收获'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedItem && <div className="fixed inset-0 z-40 bg-slate-900/30 grid place-items-center p-4" onClick={() => setSelectedItem(null)}><div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}><div className="text-5xl">{stageMeta[selectedItem.growth_stage]?.icon}</div><h3 className="text-xl font-semibold mt-3">{selectedItem.task_title}</h3><div className="mt-3 space-y-1 text-sm text-slate-600"><p>日期：{selectedItem.date}</p><p>专注时长：{selectedItem.duration_minutes} 分钟</p><p>专注质量：{selectedItem.focus_quality ? `${selectedItem.focus_quality}/5` : '未记录'}</p><p>成长阶段：{stageMeta[selectedItem.growth_stage]?.label}</p></div><button onClick={() => setSelectedItem(null)} className="mt-5 w-full py-2 rounded-lg bg-slate-900 text-white">关闭</button></div></div>}
    </div>
  );
}

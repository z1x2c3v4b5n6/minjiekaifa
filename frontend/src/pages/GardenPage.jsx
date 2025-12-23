import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function GardenPage() {
  const [overview, setOverview] = useState(null);
  const [range, setRange] = useState('day');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

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
              <div key={item.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.category || '自由专注'}</p>
                  <p className="text-xs text-slate-500">日期：{item.date} · 类型：{item.item_type}</p>
                  <p className="text-xs text-slate-400">Session #{item.session_id}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${item.is_dead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {item.is_dead ? '枯萎' : '成长'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

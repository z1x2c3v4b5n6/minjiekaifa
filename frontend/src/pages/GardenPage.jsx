import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function GardenPage() {
  const [overview, setOverview] = useState(null);

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

  const progress = overview ? Math.min(overview.current_exp / overview.next_level_exp, 1) : 0;

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
            <p className="text-sm text-slate-500">未来会支持更多可视化，例如花园小树的动画展示。</p>
          </div>
        )}
      </div>
    </div>
  );
}

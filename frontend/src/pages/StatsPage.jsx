import React, { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

export default function StatsPage() {
  const [overview, setOverview] = useState(null);
  const [moods, setMoods] = useState([]);

  const fetchData = async () => {
    try {
      const [overviewRes, moodRes] = await Promise.all([
        api.get('/stats/overview/?days=7'),
        api.get('/moods/recent/?days=14'),
      ]);
      setOverview(overviewRes.data);
      setMoods(moodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-slate-500">数据统计</p>
        <h1 className="text-2xl font-semibold text-slate-900">专注趋势与情绪</h1>
      </div>

      {!overview ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : (
        <>
          <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">近 7 天专注趋势</h3>
            <LineChart data={overview.daily_minutes} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">任务完成率</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {(overview.completion_rate * 100).toFixed(0)}%
                  </p>
                </div>
                <p className="text-sm text-slate-500">{overview.completed_tasks}/{overview.total_tasks} 完成</p>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
                  style={{ width: `${Math.min(overview.completion_rate * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">完成率 = 已完成任务 / 总任务</p>
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">分类占比</h3>
              <div className="space-y-2">
                {Object.keys(overview.category_stats || {}).length === 0 && (
                  <p className="text-sm text-slate-500">暂无数据</p>
                )}
                {Object.entries(overview.category_stats || {}).map(([cat, minutes]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{cat}</span>
                      <span>{minutes} 分钟</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${minutes / getMaxValue(overview.category_stats) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">情绪时间轴</h3>
          <p className="text-sm text-slate-500">最近 14 天</p>
        </div>
        {moods.length === 0 ? (
          <p className="text-sm text-slate-500">暂无情绪记录</p>
        ) : (
          <div className="space-y-2">
            {moods.map((mood) => (
              <div key={mood.id || mood.date} className="flex items-center gap-3">
                <div className="w-28 text-sm text-slate-500">{mood.date}</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400"
                      style={{ width: `${(Number(mood.mood) / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{mood.note}</p>
                </div>
                <div className="w-10 text-right text-sm font-semibold text-slate-700">{mood.mood}/5</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getMaxValue(obj) {
  const values = Object.values(obj || {});
  return values.length ? Math.max(...values) : 1;
}

function LineChart({ data }) {
  const max = useMemo(() => (data && data.length ? Math.max(...data.map((d) => d.minutes)) || 1 : 1), [data]);
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data
      .map((item, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * 100;
        const y = 100 - (item.minutes / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, max]);

  return (
    <div className="h-56">
      {(!data || data.length === 0) && <p className="text-sm text-slate-500">暂无数据</p>}
      {data && data.length > 0 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-emerald-500">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
          />
          {data.map((item, idx) => {
            const x = (idx / Math.max(data.length - 1, 1)) * 100;
            const y = 100 - (item.minutes / max) * 100;
            return <circle key={item.date} cx={x} cy={y} r="1.5" fill="currentColor" />;
          })}
        </svg>
      )}
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        {data?.map((item) => (
          <span key={item.date}>{item.date}</span>
        ))}
      </div>
    </div>
  );
}

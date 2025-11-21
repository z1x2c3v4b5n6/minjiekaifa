import React, { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

export default function StatsPage() {
  const [overview, setOverview] = useState(null);
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState({ mood: null, note: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [overviewRes, moodRes, todayRes] = await Promise.all([
        api.get('/stats/overview/?days=7'),
        api.get('/moods/recent/?days=14'),
        api.get('/moods/today/'),
      ]);
      setOverview(overviewRes.data);
      setMoods(moodRes.data);
      setTodayMood({ mood: todayRes.data.mood, note: todayRes.data.note || '' });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveMood = async (e) => {
    e.preventDefault();
    if (!todayMood.mood) return;
    setSaving(true);
    try {
      await api.post('/moods/today/', todayMood);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-slate-500">数据统计</p>
        <h1 className="text-2xl font-semibold text-slate-900">专注趋势与情绪</h1>
      </div>

      <div className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">今日心情</p>
          <p className="text-lg font-semibold text-slate-900">
            {todayMood.mood ? `已选择：${moodEmoji(todayMood.mood)} ${todayMood.mood}/5` : '请记录今天的心情'}
          </p>
        </div>
        <form className="flex flex-col md:flex-row items-start md:items-center gap-3" onSubmit={saveMood}>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setTodayMood((prev) => ({ ...prev, mood: m }))}
                className={`w-10 h-10 rounded-full text-lg border flex items-center justify-center ${
                  todayMood.mood === m ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 bg-white'
                }`}
              >
                {moodEmoji(m)}
              </button>
            ))}
          </div>
          <input
            className="w-full md:w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="写一句小日记..."
            value={todayMood.note}
            onChange={(e) => setTodayMood((prev) => ({ ...prev, note: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving || !todayMood.mood}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存心情'}
          </button>
        </form>
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
              <div key={mood.id || mood.date} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-24 text-sm text-slate-500">{mood.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-lg">
                    <span>{moodEmoji(mood.mood)}</span>
                    <span className="text-slate-700 font-semibold">{mood.mood}/5</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{mood.note || '无备注'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function moodEmoji(value) {
  const map = {
    1: '😢',
    2: '😟',
    3: '😐',
    4: '🙂',
    5: '😄',
  };
  return map[value] || '🙂';
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

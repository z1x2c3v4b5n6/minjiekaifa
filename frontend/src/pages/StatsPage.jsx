import React, { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

export default function StatsPage() {
  const [overview, setOverview] = useState(null);
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState({ mood: null, note: '' });
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState(null);
  const [review, setReview] = useState({ achievement: '', blocker: '', reflection: '', tomorrow_priority: '', planned_pomodoros: 4 });
  const [reviewSaved, setReviewSaved] = useState(false);
  const [days, setDays] = useState(7);

  const fetchData = async () => {
    try {
      const [overviewRes, moodRes, todayRes, insightsRes, reviewRes] = await Promise.all([
        api.get(`/stats/overview/?days=${days}`),
        api.get('/moods/recent/?days=14'),
        api.get('/moods/today/'),
        api.get(`/stats/insights/?days=${days}`),
        api.get('/reviews/today/'),
      ]);
      setOverview(overviewRes.data);
      setMoods(moodRes.data);
      setTodayMood({ mood: todayRes.data.mood, note: todayRes.data.note || '' });
      setInsights(insightsRes.data);
      if (reviewRes.data) setReview(reviewRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/reviews/today/', review);
      setReview(res.data);
      setReviewSaved(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const exportData = async () => {
    const response = await api.get('/stats/export/', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timegarden-focus-sessions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="flex items-center justify-between gap-4">
        <div>
        <p className="text-sm text-slate-500">数据统计</p>
        <h1 className="text-2xl font-semibold text-slate-900">专注趋势与情绪</h1>
        </div>
        <div className="flex gap-2"><select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm"><option value="7">近 7 天</option><option value="30">近 30 天</option><option value="90">近 90 天</option></select><button onClick={exportData} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm">导出 CSV</button></div>
      </div>

      {insights && (
        <div className="card p-5 bg-gradient-to-r from-emerald-50 to-sky-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-slate-500">智能复盘</p><h2 className="text-lg font-semibold">本周行动建议</h2></div>
            <div className="text-sm text-slate-600">完整专注率 {(insights.completion_rate * 100).toFixed(0)}% · 平均质量 {insights.average_quality || '-'}/5</div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">{insights.suggestions.map((item) => <li key={item}>• {item}</li>)}</ul>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl bg-white/70 p-3"><p className="text-xs text-slate-500">计划偏差</p><p className="text-xl font-semibold">{insights.estimate_variance > 0 ? '+' : ''}{insights.estimate_variance} 番茄</p></div>
            <div className="rounded-xl bg-white/70 p-3"><p className="text-xs text-slate-500">高效时段</p><p className="text-xl font-semibold">{insights.hourly_productivity?.length ? `${insights.hourly_productivity.reduce((a, b) => Number(a.minutes) > Number(b.minutes) ? a : b).hour}:00` : '-'}</p></div>
            <div className="rounded-xl bg-white/70 p-3"><p className="text-xs text-slate-500">主要中断</p><p className="text-xl font-semibold">{insights.top_interruption?.interruption_type || '无'}</p><p className="text-xs text-slate-400 mt-1">平均发生于 {insights.average_interruption_minute || '-'} 分钟</p></div>
          </div>
        </div>
      )}

      <form onSubmit={saveReview} className="card p-5 space-y-4">
        <div><p className="text-sm text-slate-500">每日复盘</p><h2 className="text-lg font-semibold">为明天留下一个清晰起点</h2></div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-600">今天最大的进展<input value={review.achievement || ''} onChange={(e) => setReview({ ...review, achievement: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm text-slate-600">主要阻碍<select value={review.blocker || ''} onChange={(e) => setReview({ ...review, blocker: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">无</option><option value="手机干扰">手机干扰</option><option value="环境干扰">环境干扰</option><option value="任务太难">任务太难</option><option value="疲劳">疲劳</option><option value="临时事务">临时事务</option></select></label>
          <label className="text-sm text-slate-600">一句复盘<input value={review.reflection || ''} onChange={(e) => setReview({ ...review, reflection: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm text-slate-600">明天最重要的事<input value={review.tomorrow_priority || ''} onChange={(e) => setReview({ ...review, tomorrow_priority: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm text-slate-600">明日番茄目标<input type="number" min="0" max="20" value={review.planned_pomodoros || 0} onChange={(e) => setReview({ ...review, planned_pomodoros: Number(e.target.value) })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        </div>
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">{reviewSaved ? '已保存' : saving ? '保存中...' : '保存今日复盘'}</button>
      </form>

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
              <p className="text-xs text-slate-400">中断投入：{overview.interrupted_minutes || 0} 分钟 / {overview.interrupted_sessions || 0} 次（不计入有效专注）</p>
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

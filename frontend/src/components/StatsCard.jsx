import React from 'react';

export default function StatsCard({ title, value, sub, icon, accent = 'emerald' }) {
  const accentClass =
    accent === 'purple'
      ? 'bg-purple-100 text-purple-700'
      : accent === 'blue'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-emerald-100 text-emerald-700';
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accentClass}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

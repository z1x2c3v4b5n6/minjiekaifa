import React, { useState } from 'react';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const presets = [25, 45, 60];

export default function PomodoroTimer({ tasks = [] }) {
  const navigate = useNavigate();
  const [taskId, setTaskId] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState(30);

  const startFocus = () => {
    const params = new URLSearchParams();
    if (taskId) params.set('task', taskId);
    params.set('minutes', String(minutes));
    navigate(`/focus?${params.toString()}`);
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center shrink-0"><ClockIcon className="h-6 w-6" /></div>
        <div><p className="text-sm text-slate-500">快速开始</p><h3 className="text-xl font-semibold text-slate-900">下一轮专注</h3></div>
      </div>

      <label className="block text-sm text-slate-600 mt-5">关联任务
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white">
          <option value="">自由专注</option>
          {tasks.filter((task) => task.status !== 'done').map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
      </label>

      <div className="mt-4"><p className="text-sm text-slate-600">专注时长</p><div className="grid grid-cols-3 gap-2 mt-2">{presets.map((value) => <button key={value} onClick={() => setMinutes(value)} className={`py-2 rounded-lg border text-sm ${minutes === value ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-600'}`}>{value} 分钟</button>)}</div></div>

      <div className="flex gap-2 mt-3"><input type="number" min="1" max="240" value={custom} onChange={(e) => setCustom(Math.min(240, Math.max(1, Number(e.target.value) || 1)))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button onClick={() => setMinutes(custom)} className={`px-4 rounded-lg border text-sm ${minutes === custom && !presets.includes(minutes) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>使用自定义</button></div>

      <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 flex items-center justify-between"><div><p className="text-xs text-slate-400">本轮时间</p><p className="text-2xl font-semibold text-slate-900">{minutes} <span className="text-sm font-normal text-slate-500">分钟</span></p></div><button onClick={startFocus} className="h-11 w-11 rounded-xl bg-emerald-500 text-white grid place-items-center hover:bg-emerald-600" aria-label="进入专注"><ArrowRightIcon className="h-5 w-5" /></button></div>
    </div>
  );
}

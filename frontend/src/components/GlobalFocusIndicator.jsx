import React, { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { notifyTimerComplete, prepareReminder } from '../utils/reminder.js';

const STORAGE_KEY = 'timegarden.focusTimer';

const readTimer = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
};

export default function GlobalFocusIndicator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(readTimer());
  const alertedEndAt = useRef(null);

  useEffect(() => {
    const update = () => {
      const saved = readTimer();
      if (saved?.status === 'running') {
        const remaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
        const next = { ...saved, remaining };
        setTimer(next);
        if (location.pathname !== '/focus' && remaining <= 0 && alertedEndAt.current !== saved.endAt && !saved.completionNotified) {
          alertedEndAt.current = saved.endAt;
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, remaining: 0, completionNotified: true }));
          notifyTimerComplete({ title: saved.phase === 'focus' ? '专注完成' : '休息结束', body: '点击返回专注页处理本轮结果。' });
        }
      } else {
        setTimer(saved);
      }
    };
    update();
    const interval = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', update); };
  }, [location.pathname]);

  if (!timer || location.pathname === '/focus') return null;
  const remaining = timer.status === 'running' ? Math.max(0, timer.remaining || 0) : timer.remaining || 0;
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  const toggleTimer = async () => {
    if (timer.status === 'running') {
      const paused = { ...timer, status: 'paused', remaining: Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)) };
      delete paused.endAt;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paused));
      setTimer(paused);
    } else {
      await prepareReminder();
      const running = { ...timer, status: 'running', endAt: Date.now() + remaining * 1000, completionNotified: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(running));
      setTimer(running);
    }
  };

  return (
    <aside className="fixed right-6 bottom-6 z-30 w-80 rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur shadow-2xl p-4" aria-label="正在进行的专注">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center"><ClockIcon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-xs text-emerald-600 font-semibold">{remaining <= 0 ? '本轮已结束' : timer.status === 'running' ? '专注进行中' : '专注已暂停'}</p><p className="font-medium text-slate-800 truncate">{timer.taskTitle || '自由专注'}</p></div><p className="text-2xl font-semibold tabular-nums text-slate-900">{minutes}:{seconds}</p></div>
      <div className="flex gap-2 mt-3">{remaining > 0 && <button onClick={toggleTimer} className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">{timer.status === 'running' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}{timer.status === 'running' ? '暂停' : '继续'}</button>}<button onClick={() => navigate('/focus')} className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"><ArrowTopRightOnSquareIcon className="h-4 w-4" />{remaining <= 0 ? '处理结果' : '返回专注'}</button></div>
    </aside>
  );
}

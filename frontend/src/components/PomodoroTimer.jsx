import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import api from '../api.js';

const presets = [
  { label: '25 分钟', minutes: 25 },
  { label: '45 分钟', minutes: 45 },
];

export default function PomodoroTimer({ tasks = [], onSessionLogged }) {
  const [modeMinutes, setModeMinutes] = useState(25);
  const [custom, setCustom] = useState(25);
  const [remaining, setRemaining] = useState(modeMinutes * 60);
  const [running, setRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    setRemaining(modeMinutes * 60);
  }, [modeMinutes]);

  useEffect(() => {
    if (!running) return undefined;
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const minutes = useMemo(() => String(Math.floor(remaining / 60)).padStart(2, '0'), [remaining]);
  const seconds = useMemo(() => String(remaining % 60).padStart(2, '0'), [remaining]);
  const progress = useMemo(() => 1 - remaining / (modeMinutes * 60), [remaining, modeMinutes]);

  const startTimer = () => {
    setRemaining(modeMinutes * 60);
    startedAtRef.current = new Date().toISOString();
    setRunning(true);
  };

  const pauseTimer = () => {
    setRunning(false);
  };

  const stopTimer = () => {
    setRunning(false);
    setRemaining(modeMinutes * 60);
    startedAtRef.current = null;
  };

  const handleComplete = async () => {
    setRunning(false);
    const endedAt = new Date().toISOString();
    const payload = {
      task: selectedTask ? selectedTask.id : null,
      duration_minutes: modeMinutes,
      is_completed: true,
      started_at: startedAtRef.current,
      ended_at: endedAt,
    };
    try {
      await api.post('/sessions/', payload);
      onSessionLogged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setRemaining(modeMinutes * 60);
      startedAtRef.current = null;
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">番茄计时器</p>
          <p className="text-xl font-semibold text-slate-900">专注一下</p>
        </div>
        <select
          className="text-sm rounded-full border border-slate-200 px-3 py-2 bg-white"
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = tasks.find((t) => String(t.id) === e.target.value);
            setSelectedTask(task || null);
          }}
        >
          <option value="">自由专注</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.minutes}
            className={`px-4 py-2 rounded-full border text-sm ${
              modeMinutes === preset.minutes
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-slate-200 text-slate-600 hover:border-emerald-300'
            }`}
            onClick={() => setModeMinutes(preset.minutes)}
          >
            {preset.label}
          </button>
        ))}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            min="5"
            className="w-16 px-2 py-1 rounded border border-slate-200"
            value={custom}
            onChange={(e) => setCustom(Number(e.target.value) || 0)}
          />
          <button
            className={`px-4 py-2 rounded-full border text-sm ${
              modeMinutes === custom
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-slate-200 text-slate-600 hover:border-emerald-300'
            }`}
            onClick={() => setModeMinutes(custom)}
          >
            自定义
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative h-56 w-56">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#10b981 ${progress * 360}deg, #e2e8f0 ${progress * 360}deg)` ,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white shadow-inner border border-slate-100 grid place-items-center">
            <div className="text-5xl font-bold text-slate-900">
              {minutes}:{seconds}
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedTask ? selectedTask.title : '自由模式'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!running ? (
            <button
              onClick={startTimer}
              className="px-5 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow hover:bg-emerald-600 flex items-center gap-2"
            >
              <PlayIcon className="h-5 w-5" />
              开始
            </button>
          ) : (
            <>
              <button
                onClick={pauseTimer}
                className="px-4 py-3 rounded-full bg-amber-500 text-white font-semibold shadow hover:bg-amber-600 flex items-center gap-2"
              >
                <PauseIcon className="h-5 w-5" />
                暂停
              </button>
              <button
                onClick={stopTimer}
                className="px-4 py-3 rounded-full bg-slate-200 text-slate-700 font-semibold shadow hover:bg-slate-300 flex items-center gap-2"
              >
                <StopIcon className="h-5 w-5" />
                结束
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

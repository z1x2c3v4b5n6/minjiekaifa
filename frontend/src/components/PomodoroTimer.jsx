import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import api from '../api.js';

export default function PomodoroTimer({ tasks = [], defaultMinutes = 25, onSessionLogged }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setRemaining(defaultMinutes * 60);
  }, [defaultMinutes]);

  useEffect(() => {
    if (!running) return;
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

  const handleStart = () => {
    setRemaining(defaultMinutes * 60);
    setIsPaused(false);
    setRunning(true);
  };

  const handlePause = () => {
    setIsPaused(true);
    setRunning(false);
  };

  const handleStop = () => {
    setRunning(false);
    setIsPaused(false);
    setRemaining(defaultMinutes * 60);
  };

  const handleComplete = async () => {
    setRunning(false);
    setIsPaused(false);
    const payload = {
      task: selectedTask ? selectedTask.id : null,
      duration_minutes: defaultMinutes,
      is_completed: true,
      interrupted_reason: '',
    };
    try {
      await api.post('/sessions/', payload);
      onSessionLogged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setRemaining(defaultMinutes * 60);
    }
  };

  return (
    <div className="card p-6 gradient-ring">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">番茄计时</p>
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-52 w-52 rounded-full bg-white shadow-inner flex items-center justify-center border border-slate-100">
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-50 to-sky-50" />
          <div className="relative text-5xl font-bold text-slate-900">
            {minutes}:{seconds}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!running ? (
            <button
              onClick={handleStart}
              className="px-5 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow hover:bg-emerald-600 flex items-center gap-2"
            >
              <PlayIcon className="h-5 w-5" />
              开始
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="px-4 py-3 rounded-full bg-amber-500 text-white font-semibold shadow hover:bg-amber-600 flex items-center gap-2"
              >
                <PauseIcon className="h-5 w-5" />
                暂停
              </button>
              <button
                onClick={handleStop}
                className="px-4 py-3 rounded-full bg-slate-200 text-slate-700 font-semibold shadow hover:bg-slate-300 flex items-center gap-2"
              >
                <StopIcon className="h-5 w-5" />
                结束
              </button>
            </>
          )}
        </div>
        {isPaused && <p className="text-xs text-amber-600">已暂停，点击结束重置或再次开始。</p>}
      </div>
    </div>
  );
}

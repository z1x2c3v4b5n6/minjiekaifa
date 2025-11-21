import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App.jsx';
import api from '../api.js';

const scenes = [
  { label: '雨声 Rain', value: 'rain', color: 'from-sky-100 to-slate-100' },
  { label: '海边 Sea', value: 'sea', color: 'from-cyan-100 to-blue-100' },
  { label: '咖啡馆 Cafe', value: 'cafe', color: 'from-amber-100 to-orange-100' },
];

export default function FocusPage({ isAdmin }) {
  const { profile } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scene, setScene] = useState(profile?.default_scene || 'rain');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState((profile?.default_focus_minutes || 25) * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/tasks/').then((res) => setTasks(res.data));
  }, []);

  useEffect(() => {
    setRemaining((profile?.default_focus_minutes || 25) * 60);
    setScene(profile?.default_scene || 'rain');
  }, [profile]);

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

  const handleComplete = async () => {
    setRunning(false);
    try {
      await api.post('/sessions/', {
        task: selectedTask ? selectedTask.id : null,
        duration_minutes: profile?.default_focus_minutes || 25,
        is_completed: true,
        interrupted_reason: '',
      });
    } catch (err) {
      console.error(err);
    }
    setRemaining((profile?.default_focus_minutes || 25) * 60);
  };

  const handleStop = async () => {
    setRunning(false);
    clearInterval(timerRef.current);
    await api.post('/sessions/', {
      task: selectedTask ? selectedTask.id : null,
      duration_minutes: Math.round((remaining / 60) * 10) / 10,
      is_completed: false,
      interrupted_reason: '手动结束',
    });
    setRemaining((profile?.default_focus_minutes || 25) * 60);
  };

  return (
    <div className={`min-h-[80vh] card p-8 bg-gradient-to-br ${scenes.find((s) => s.value === scene)?.color || 'from-white to-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">全屏专注</p>
          <h1 className="text-3xl font-bold text-slate-900">进入心流</h1>
          <p className="text-slate-500 text-sm mt-1">选择喜欢的环境音场景，开始一段深度专注。</p>
        </div>
        <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeftIcon className="h-5 w-5" /> 返回仪表盘
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-60 w-60 rounded-full bg-white shadow-xl flex items-center justify-center border border-white/70">
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-100 via-white to-sky-100" />
            <div className="relative text-5xl font-bold text-slate-900">
              {minutes}:{seconds}
            </div>
          </div>
          <div className="flex gap-3">
            {!running ? (
              <button
                onClick={() => {
                  setRemaining((profile?.default_focus_minutes || 25) * 60);
                  setRunning(true);
                }}
                className={`px-6 py-3 rounded-full text-white font-semibold shadow ${isAdmin ? 'bg-purple-500 hover:bg-purple-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                开始专注
              </button>
            ) : (
              <>
                <button
                  onClick={() => setRunning(false)}
                  className="px-4 py-3 rounded-full bg-amber-500 text-white font-semibold shadow hover:bg-amber-600"
                >
                  暂停
                </button>
                <button
                  onClick={handleStop}
                  className="px-4 py-3 rounded-full bg-white/80 text-slate-700 font-semibold shadow border"
                >
                  结束并保存
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-slate-600">当前任务：{selectedTask ? selectedTask.title : '自由专注'}</p>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">关联任务</p>
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const task = tasks.find((t) => String(t.id) === e.target.value);
                setSelectedTask(task || null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">自由专注</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">环境音场景</p>
                <p className="text-lg font-semibold text-slate-900">{scene}</p>
              </div>
              <MusicalNoteIcon className="h-6 w-6 text-slate-400" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {scenes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScene(s.value)}
                  className={`rounded-xl px-3 py-2 text-sm border ${scene === s.value ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">（示例界面效果，环境音可按需替换真实音频）</p>
          </div>
        </div>
      </div>
    </div>
  );
}

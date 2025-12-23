import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App.jsx';
import api from '../api.js';

export default function FocusPage({ isAdmin }) {
  const { profile } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scene, setScene] = useState(profile?.default_scene || 'rain');
  const [availableSounds, setAvailableSounds] = useState([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('focus');
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState((profile?.default_focus_minutes || 25) * 60);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get('/tasks/').then((res) => setTasks(res.data));
  }, []);

  useEffect(() => {
    api.get('/sounds/').then((res) => setAvailableSounds(res.data));
  }, []);

  const scenes = useMemo(() => {
    const palette = ['from-sky-100 to-slate-100', 'from-cyan-100 to-blue-100', 'from-amber-100 to-orange-100', 'from-purple-100 to-indigo-100'];
    const dynamic = availableSounds.map((sound, idx) => ({
      label: sound.name,
      value: sound.key,
      url: sound.url,
      color: palette[idx % palette.length],
    }));
    return [{ label: '无声 None', value: 'none', color: 'from-white to-white' }, ...dynamic];
  }, [availableSounds]);

  const phaseDurations = useMemo(() => {
    return {
      focus: profile?.default_focus_minutes || 25,
      shortBreak: profile?.default_short_break_minutes || 5,
      longBreak: profile?.default_long_break_minutes || 15,
    };
  }, [profile]);

  useEffect(() => {
    setRemaining(phaseDurations[phase] * 60);
  }, [phase, phaseDurations]);

  useEffect(() => {
    const defaultScene = profile?.default_scene || 'rain';
    const availableKeys = scenes.map((s) => s.value);
    if (availableKeys.includes(defaultScene)) {
      setScene(defaultScene);
    } else {
      setScene('none');
    }
  }, [profile, scenes]);

  // load audio when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const targetScene = scenes.find((s) => s.value === scene);
    if (phase !== 'focus' || !targetScene || !targetScene.url || scene === 'none') return undefined;
    const audio = new Audio(targetScene.url);
    audio.loop = true;
    audioRef.current = audio;
    if (running) {
      audio.play().catch(() => {});
    }
    return () => {
      audio.pause();
    };
  }, [scene, phase]);

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

  // control audio play/pause with running state
  useEffect(() => {
    if (!audioRef.current) return;
    if (running && scene !== 'none' && phase === 'focus') {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [running, scene, phase]);

  const minutes = useMemo(() => String(Math.floor(remaining / 60)).padStart(2, '0'), [remaining]);
  const seconds = useMemo(() => String(remaining % 60).padStart(2, '0'), [remaining]);
  const selectedScene = useMemo(() => scenes.find((s) => s.value === scene), [scenes, scene]);
  const phaseLabel = phase === 'focus' ? '专注时间' : phase === 'shortBreak' ? '短休' : '长休';
  const handleAdvancePhase = () => {
    if (phase === 'focus') {
      if (round >= 4) {
        setPhase('longBreak');
      } else {
        setPhase('shortBreak');
      }
      return;
    }
    if (phase === 'shortBreak') {
      setPhase('focus');
      setRound((prev) => Math.min(prev + 1, 4));
      return;
    }
    setPhase('focus');
    setRound(1);
  };

  const handleComplete = async () => {
    setRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (phase === 'focus') {
      try {
        await api.post('/sessions/', {
          task: selectedTask ? selectedTask.id : null,
          duration_minutes: phaseDurations.focus,
          is_completed: true,
          interrupted_reason: '',
        });
      } catch (err) {
        console.error(err);
      }
    }
    handleAdvancePhase();
  };

  const handleStop = async () => {
    setRunning(false);
    clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (phase === 'focus') {
      await api.post('/sessions/', {
        task: selectedTask ? selectedTask.id : null,
        duration_minutes: Math.round((remaining / 60) * 10) / 10,
        is_completed: false,
        interrupted_reason: '手动结束',
      });
    }
    setPhase('focus');
    setRound(1);
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
          <div className="text-center">
            <p className="text-sm text-slate-500">{phaseLabel}</p>
            <p className="text-lg font-semibold text-slate-900">第 {round}/4 个番茄</p>
          </div>
          <div className="flex gap-3">
            {!running ? (
              <button
                onClick={() => {
                  if (remaining <= 0) {
                    setRemaining(phaseDurations[phase] * 60);
                  }
                  setRunning(true);
                }}
                className={`px-6 py-3 rounded-full text-white font-semibold shadow ${isAdmin ? 'bg-purple-500 hover:bg-purple-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {phase === 'focus' ? '开始专注' : '开始休息'}
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
            {phase !== 'focus' && (
              <p className="text-xs text-slate-400 mt-2">休息阶段不计入番茄统计。</p>
            )}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">环境音场景</p>
                <p className="text-lg font-semibold text-slate-900">{selectedScene?.label || '无声'}</p>
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
            <p className="text-xs text-slate-400 mt-2">（开始计时时播放，暂停/结束时自动停止）</p>
          </div>
        </div>
      </div>
    </div>
  );
}

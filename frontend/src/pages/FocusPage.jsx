import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App.jsx';
import api from '../api.js';
import { notifyTimerComplete, prepareReminder } from '../utils/reminder.js';

const FOCUS_STORAGE_KEY = 'timegarden.focusTimer';
const loadSavedTimer = () => {
  try { return JSON.parse(localStorage.getItem(FOCUS_STORAGE_KEY)) || {}; } catch { return {}; }
};

export default function FocusPage({ isAdmin }) {
  const savedTimer = useRef(loadSavedTimer()).current;
  const { profile } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const requestedMinutes = Number(searchParams.get('minutes'));
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scene, setScene] = useState(profile?.default_scene || 'rain');
  const [availableSounds, setAvailableSounds] = useState([]);
  const [running, setRunning] = useState(savedTimer.status === 'running' && savedTimer.endAt > Date.now());
  const [phase, setPhase] = useState(savedTimer.phase || 'focus');
  const [focusCount, setFocusCount] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(savedTimer.durationMinutes || (requestedMinutes >= 1 && requestedMinutes <= 240 ? requestedMinutes : (profile?.default_focus_minutes || 25)));
  const [remaining, setRemaining] = useState(savedTimer.status === 'running' && savedTimer.endAt > Date.now() ? Math.ceil((savedTimer.endAt - Date.now()) / 1000) : savedTimer.remaining || (profile?.default_focus_minutes || 25) * 60);
  const [endAt, setEndAt] = useState(savedTimer.endAt || null);
  const [pendingSession, setPendingSession] = useState(null);
  const [feedback, setFeedback] = useState({ focus_quality: 4, interruption_type: '', interrupted_reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [goalTask, setGoalTask] = useState(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const startedAtRef = useRef(savedTimer.startedAt || null);
  const pauseCountRef = useRef(0);
  const clientSessionIdRef = useRef(savedTimer.clientSessionId || null);
  const restoredRef = useRef(Boolean(savedTimer.status));

  useEffect(() => {
    api.get('/tasks/').then((res) => {
      const activeTasks = res.data.filter((task) => task.status !== 'done');
      setTasks(activeTasks);
      const requested = searchParams.get('task');
      const selectedId = requested || savedTimer.taskId;
      if (selectedId) setSelectedTask(activeTasks.find((task) => String(task.id) === String(selectedId)) || null);
    });
  }, []);

  useEffect(() => {
    api.get('/sounds/').then((res) => {
      const filtered = [...res.data];
      if (!filtered.find((sound) => (sound.scene || sound.key) === 'none')) {
        filtered.unshift({ id: 'none', name: '无声', scene: 'none', url: '' });
      }
      setAvailableSounds(filtered);
    });
  }, []);

  const scenes = useMemo(() => {
    const palette = ['from-sky-100 to-slate-100', 'from-cyan-100 to-blue-100', 'from-amber-100 to-orange-100', 'from-purple-100 to-indigo-100'];
    const dynamic = availableSounds.map((sound, idx) => ({
      label: sound.name,
      value: sound.scene || sound.key,
      url: sound.url,
      color: palette[idx % palette.length],
    }));
    return dynamic;
  }, [availableSounds]);

  const focusDuration = useMemo(() => focusMinutes * 60, [focusMinutes]);
  const shortBreakDuration = useMemo(() => (profile?.default_short_break_minutes || 5) * 60, [profile]);
  const longBreakDuration = useMemo(() => (profile?.default_long_break_minutes || 15) * 60, [profile]);

  useEffect(() => {
    if (!requestedMinutes && profile?.default_focus_minutes && !running && !savedTimer.status) {
      setFocusMinutes(profile.default_focus_minutes);
    }
  }, [profile]);

  useEffect(() => {
    const defaultScene = profile?.default_scene || 'rain';
    const availableKeys = scenes.map((s) => s.value);
    if (availableKeys.includes(defaultScene)) {
      setScene(defaultScene);
    } else {
      setScene('none');
    }
  }, [profile, scenes]);

  useEffect(() => {
    if (restoredRef.current) {
      restoredRef.current = false;
      return;
    }
    if (phase === 'focus') {
      setRemaining(focusDuration);
    } else if (phase === 'short_break') {
      setRemaining(shortBreakDuration);
    } else {
      setRemaining(longBreakDuration);
    }
  }, [phase, focusDuration, shortBreakDuration, longBreakDuration]);

  // load audio when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const targetScene = scenes.find((s) => s.value === scene);
    if (!targetScene || !targetScene.url || scene === 'none') return undefined;
    const audio = new Audio(targetScene.url);
    audio.loop = true;
    audioRef.current = audio;
    if (running) {
      audio.play().catch(() => {});
    }
    return () => {
      audio.pause();
    };
  }, [scene]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        clearInterval(timerRef.current);
        handleComplete();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, endAt]);

  // control audio play/pause with running state
  useEffect(() => {
    if (!audioRef.current) return;
    if (running && scene !== 'none') {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [running, scene]);

  const minutes = useMemo(() => String(Math.floor(remaining / 60)).padStart(2, '0'), [remaining]);
  const seconds = useMemo(() => String(remaining % 60).padStart(2, '0'), [remaining]);
  const selectedScene = useMemo(() => scenes.find((s) => s.value === scene), [scenes, scene]);
  const phaseLabel = useMemo(() => {
    if (phase === 'short_break') return '短休息';
    if (phase === 'long_break') return '长休息';
    return '专注';
  }, [phase]);
  const phaseDuration = useMemo(() => {
    if (phase === 'short_break') return shortBreakDuration;
    if (phase === 'long_break') return longBreakDuration;
    return focusDuration;
  }, [phase, focusDuration, shortBreakDuration, longBreakDuration]);

  const focusCycles = 4;

  useEffect(() => {
    if (savedTimer.status === 'running' && savedTimer.endAt <= Date.now()) {
      window.setTimeout(() => handleComplete(), 0);
    }
  }, []);

  useEffect(() => {
    const warnBeforeLeave = (event) => {
      if (!running) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [running]);

  const handleComplete = async () => {
    setRunning(false);
    localStorage.removeItem(FOCUS_STORAGE_KEY);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (phase === 'focus') {
      notifyTimerComplete({ title: '专注完成', body: '做得很好，请记录本次专注感受。' });
      setPendingSession({ completed: true, duration: savedTimer.durationMinutes || focusDuration / 60, endedAt: new Date().toISOString() });
    } else {
      notifyTimerComplete({ title: '休息结束', body: '休息完成，可以开始下一轮专注了。' });
      setPhase('focus');
    }
  };

  const handleStop = async () => {
    setRunning(false);
    clearInterval(timerRef.current);
    localStorage.removeItem(FOCUS_STORAGE_KEY);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (phase === 'focus') {
      const elapsedMinutes = Math.max(0, (focusDuration - remaining) / 60);
      if (elapsedMinutes >= 0.1) {
        setPendingSession({ completed: false, duration: elapsedMinutes, endedAt: new Date().toISOString() });
      }
    }
  };

  const startTimer = () => {
    prepareReminder();
    if (!startedAtRef.current || remaining === phaseDuration) {
      startedAtRef.current = new Date().toISOString();
      pauseCountRef.current = 0;
      clientSessionIdRef.current = `focus-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    const nextEndAt = Date.now() + remaining * 1000;
    setEndAt(nextEndAt);
    setRunning(true);
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({ status: 'running', phase, remaining, endAt: nextEndAt, durationMinutes: phaseDuration / 60, taskId: selectedTask?.id || null, taskTitle: selectedTask?.title || '自由专注', startedAt: startedAtRef.current, clientSessionId: clientSessionIdRef.current, completionNotified: false }));
    setMessage('');
  };

  const submitFeedback = async () => {
    if (!pendingSession) return;
    setSubmitting(true);
    try {
      const response = await api.post('/sessions/', {
        task: selectedTask?.id || null,
        duration_minutes: pendingSession.duration.toFixed(2),
        is_completed: pendingSession.completed,
        interruption_type: pendingSession.completed ? '' : feedback.interruption_type,
        interrupted_reason: feedback.interrupted_reason,
        focus_quality: Number(feedback.focus_quality),
        pause_count: pauseCountRef.current,
        started_at: startedAtRef.current,
        ended_at: pendingSession.endedAt,
        client_session_id: clientSessionIdRef.current || `focus-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
      if (response.data.goal_reached) setGoalTask(response.data.task_progress);
      setMessage('专注记录已保存，任务进度和花园已同步更新。');
      setPendingSession(null);
      startedAtRef.current = null;
      clientSessionIdRef.current = null;
      if (pendingSession.completed) {
        const nextCount = focusCount + 1;
        setFocusCount(nextCount);
        setPhase(nextCount % focusCycles === 0 ? 'long_break' : 'short_break');
      } else {
        setPhase('focus');
        setRemaining(focusDuration);
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || '保存失败，请重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const completeGoalTask = async () => {
    try {
      await api.post(`/tasks/${goalTask.id}/complete/`);
    } catch (error) {
      if (error.response?.status === 409 && window.confirm(`还有 ${error.response.data.open_subtasks} 个子任务未完成，是否一起完成？`)) {
        await api.post(`/tasks/${goalTask.id}/complete/`, { complete_subtasks: true });
      } else {
        return;
      }
    }
    setGoalTask(null);
    setMessage('任务已完成并移出今日计划。');
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
          <p className="text-sm text-slate-500">阶段：{phaseLabel}</p>
          <div className="flex gap-3">
            {!running ? (
              <button
                onClick={() => {
                  if (remaining <= 0) {
                    setRemaining(phaseDuration);
                  }
                  startTimer();
                }}
                className={`px-6 py-3 rounded-full text-white font-semibold shadow ${isAdmin ? 'bg-purple-500 hover:bg-purple-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {phase === 'focus' ? '开始专注' : '开始休息'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    const pausedRemaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
                    pauseCountRef.current += 1;
                    setRemaining(pausedRemaining);
                    setRunning(false);
                    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({ status: 'paused', phase, remaining: pausedRemaining, durationMinutes: phaseDuration / 60, taskId: selectedTask?.id || null, taskTitle: selectedTask?.title || '自由专注', startedAt: startedAtRef.current, clientSessionId: clientSessionIdRef.current, completionNotified: false }));
                  }}
                  className="px-4 py-3 rounded-full bg-amber-500 text-white font-semibold shadow hover:bg-amber-600"
                >
                  暂停
                </button>
                <button
                  onClick={handleStop}
                  className="px-4 py-3 rounded-full bg-white/80 text-slate-700 font-semibold shadow border"
                >
                  {phase === 'focus' ? '结束并保存' : '跳过休息'}
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
            <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">本轮时长</p><p className="text-lg font-semibold text-slate-900">{focusMinutes} 分钟</p></div><span className="text-xs text-slate-400">1–240 分钟</span></div>
            <div className="grid grid-cols-3 gap-2 mt-3">{[25, 45, 60].map((value) => <button key={value} disabled={running || phase !== 'focus' || pendingSession} onClick={() => setFocusMinutes(value)} className={`rounded-lg border py-2 text-sm disabled:opacity-40 ${focusMinutes === value ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-600'}`}>{value} 分钟</button>)}</div>
            <label className="flex items-center gap-2 mt-3 text-sm text-slate-600"><span className="shrink-0">自定义</span><input type="number" min="1" max="240" disabled={running || phase !== 'focus' || pendingSession} value={focusMinutes} onChange={(e) => setFocusMinutes(Math.min(240, Math.max(1, Number(e.target.value) || 1)))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50" /><span>分钟</span></label>
            {(running || phase !== 'focus') && <p className="text-xs text-amber-600 mt-2">当前轮次进行中，结束后可以调整时长。</p>}
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
      {message && <div className="mt-5 rounded-xl bg-white/80 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {goalTask && (
        <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><p className="font-semibold text-slate-900">“{goalTask.title}”已达到预计番茄数</p><p className="text-sm text-slate-500">已完成 {goalTask.completed_pomodoros}/{goalTask.estimated_pomodoros} 个番茄，是否标记任务完成？</p></div>
          <div className="flex gap-2"><button onClick={() => setGoalTask(null)} className="px-4 py-2 rounded-lg border bg-white text-sm">暂不完成</button><button onClick={completeGoalTask} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold">标记完成</button></div>
        </div>
      )}
      {pendingSession && (
        <div className="mt-6 card p-5 border-2 border-emerald-200 bg-white/95">
          <h2 className="text-lg font-semibold text-slate-900">本次专注反馈</h2>
          <p className="text-sm text-slate-500 mt-1">记录约 {pendingSession.duration.toFixed(1)} 分钟，反馈会用于生成改进建议。</p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <label className="text-sm text-slate-600">专注质量
              <select value={feedback.focus_quality} onChange={(e) => setFeedback({ ...feedback, focus_quality: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </label>
            {!pendingSession.completed && <label className="text-sm text-slate-600">中断原因
              <select required value={feedback.interruption_type} onChange={(e) => setFeedback({ ...feedback, interruption_type: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="">请选择</option><option value="手机干扰">手机干扰</option><option value="环境干扰">环境干扰</option><option value="任务太难">任务太难</option><option value="疲劳">疲劳</option><option value="临时事务">临时事务</option><option value="其他">其他</option>
              </select>
            </label>}
            <label className="text-sm text-slate-600">备注
              <input value={feedback.interrupted_reason} onChange={(e) => setFeedback({ ...feedback, interrupted_reason: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="可选" />
            </label>
          </div>
          <button disabled={submitting || (!pendingSession.completed && !feedback.interruption_type)} onClick={submitFeedback} className="mt-4 px-5 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-50">{submitting ? '保存中...' : '保存并继续'}</button>
        </div>
      )}
    </div>
  );
}

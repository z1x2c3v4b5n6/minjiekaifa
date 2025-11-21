import React, { useEffect, useState } from 'react';
import { ArrowRightCircleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../api.js';

export default function TodayTaskList({ onSelectTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    api
      .get('/tasks/', { params: { is_today: true } })
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">今日计划</p>
          <p className="text-xl font-semibold text-slate-900">专注任务</p>
        </div>
        <button
          onClick={fetchTasks}
          className="text-sm px-3 py-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          刷新
        </button>
      </div>
      {loading ? (
        <p className="text-slate-500 text-sm">加载中...</p>
      ) : tasks.length === 0 ? (
        <p className="text-slate-500 text-sm">今天还没有安排任务，去任务页添加吧。</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelectTask?.(task)}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition bg-slate-50/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
                    {task.title.slice(0, 1)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.category || '未分类'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-100">
                    <ClockIcon className="h-4 w-4" />
                    <span>预计 {task.estimated_pomodoros || 1} 🍅</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-100">
                    {task.status === 'done' ? (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowRightCircleIcon className="h-4 w-4 text-amber-500" />
                    )}
                    <span>{task.status || 'todo'}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

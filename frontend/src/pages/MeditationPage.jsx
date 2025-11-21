import React, { useEffect, useState } from 'react';
import api from '../api.js';

const fallback = {
  goals: [
    { title: '新手入门', description: '5 分钟感受呼吸', duration: '5-7min' },
    { title: '睡个好觉', description: '夜间身体扫描', duration: '10-15min' },
  ],
  tools: [
    { type: 'breath', title: '呼吸法', pattern: '4-7-8', description: '节奏引导，快速放松神经' },
    { type: 'free', title: '自由练习', description: '自定义时长 + 环境音' },
  ],
  recent: [],
  breath_patterns: ['4-7-8'],
};

export default function MeditationPage() {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/meditations/overview/')
      .then((res) => setData(res.data || fallback))
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 text-white rounded-3xl p-8 shadow-xl">
        <p className="text-sm uppercase tracking-wide text-white/80">冥想 & 呼吸练习</p>
        <h1 className="text-3xl font-bold mt-1">安定身心的小练习</h1>
        <p className="text-sm text-white/80 mt-2">按目标快速选择，或用呼吸法/自由练习开启一段自我对话</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {data.goals?.map((goal) => (
          <div key={goal.title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-1">
            <p className="text-xs text-slate-500">{goal.duration}</p>
            <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
            <p className="text-sm text-slate-600">{goal.description}</p>
            <button className="mt-3 inline-flex px-3 py-2 rounded-lg text-sm bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100">
              开始练习
            </button>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.tools?.map((tool) => (
          <div key={tool.type} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
            <p className="text-xs text-slate-500">练习工具</p>
            <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
            {tool.pattern && <p className="text-sm text-slate-600">节奏：{tool.pattern}</p>}
            <p className="text-sm text-slate-600">{tool.description}</p>
            <div className="flex gap-2 flex-wrap text-xs text-slate-500">
              {data.breath_patterns?.map((pattern) => (
                <span key={pattern} className="px-3 py-1 rounded-full bg-slate-100">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">最近练习</h3>
          <span className="text-xs text-slate-500">最近 7 天</span>
        </div>
        {data.recent?.length === 0 && <p className="text-sm text-slate-500">暂无记录，开始一段练习试试</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {data.recent?.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-100 p-3 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.duration} · {item.date}</p>
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-sm text-slate-500">加载中...</p>}
    </div>
  );
}

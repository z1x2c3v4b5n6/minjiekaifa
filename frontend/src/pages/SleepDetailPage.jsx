import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api.js';

const fallback = {
  title: '睡眠故事',
  description: '在柔和的旁白与环境声中入睡。',
  duration: '15:00',
  tags: ['睡眠故事'],
  cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

export default function SleepDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/sleep/stories/${id}/`)
      .then((res) => setData(res.data || fallback))
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link to="/sleep" className="text-sm text-indigo-600 hover:underline">
        ← 返回睡眠列表
      </Link>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-100">
          <div
            className="h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.cover})` }}
          />
          <div className="p-5 space-y-3 bg-white">
            <p className="text-xs text-slate-500">总时长 · {data.duration}</p>
            <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{data.description}</p>
            <div className="flex gap-2 flex-wrap">
              {data.tags?.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">音频播放</h2>
          <audio controls className="w-full" src={data.audio_url}>
            Your browser does not support the audio element.
          </audio>
          <div className="space-y-2 text-sm text-slate-600">
            <p>· 找个舒服的位置，闭上眼睛，跟随旁白放松身体。</p>
            <p>· 配合你喜欢的环境音场景，调整为最舒适的音量。</p>
            <p>· 听完后可以直接进入睡眠，或写下此刻的感受。</p>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">加载中...</p>}
    </div>
  );
}

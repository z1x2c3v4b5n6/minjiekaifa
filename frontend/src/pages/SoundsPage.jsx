import React, { useEffect, useState } from 'react';
import api from '../api.js';

const tags = ['全部', '自然', '都市', '旋律', '免费', '混音'];

export default function SoundsPage() {
  const [selected, setSelected] = useState('全部');
  const [scenes, setScenes] = useState([]);
  const [presets, setPresets] = useState([]);
  const [mixName, setMixName] = useState('我的混音');
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    api
      .get('/sounds/scenes/', { params: { tag: selected } })
      .then((res) => setScenes(res.data.items || []))
      .catch(() => setScenes([]));
  }, [selected]);

  useEffect(() => {
    api
      .get('/sounds/mixes/')
      .then((res) => setPresets(res.data.presets || []))
      .catch(() => setPresets([]));
  }, []);

  const toggleLayer = (id) => {
    setLayers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveMix = () => {
    api
      .post('/sounds/mixes/', { name: mixName, layers })
      .then((res) => setPresets((prev) => [res.data, ...prev]))
      .catch(() => setPresets((prev) => prev));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-r from-sky-500 via-emerald-400 to-teal-500 text-white rounded-3xl p-8 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-white/80">环境声音 / 混音</p>
            <h1 className="text-3xl font-bold">找到让你安心的声音</h1>
            <p className="text-sm text-white/80 mt-1">自然 · 都市 · 旋律 · 免费 · 混音</p>
          </div>
          <div className="flex gap-2 overflow-auto">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelected(t)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  t === selected ? 'bg-white text-slate-900 shadow' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {scenes.map((scene) => (
            <div key={scene.id} className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${scene.cover})` }} />
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{scene.title}</p>
                  <span className="text-xs text-slate-500">{scene.category}</span>
                </div>
                <p className="text-xs text-slate-500">{scene.tags?.join(' / ')}</p>
                <button
                  onClick={() => toggleLayer(scene.title)}
                  className="text-sm text-teal-600 font-semibold hover:underline"
                >
                  {layers.includes(scene.title) ? '已加入混音' : '加入混音'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900">我的混音</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={mixName}
                onChange={(e) => setMixName(e.target.value)}
                placeholder="混音名称"
              />
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {layers.length === 0 && <span className="text-slate-400">选择左侧声音加入混音</span>}
                {layers.map((layer) => (
                  <span key={layer} className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    {layer}
                  </span>
                ))}
              </div>
              <button
                onClick={handleSaveMix}
                className="w-full bg-teal-500 text-white font-semibold rounded-lg py-2 hover:bg-teal-600"
              >
                保存预设（示例）
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900">预设 / 最近</h3>
            {presets.length === 0 && <p className="text-sm text-slate-500">暂无预设</p>}
            <div className="space-y-2">
              {presets.map((preset) => (
                <div key={preset.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{preset.name}</p>
                  <p className="text-xs text-slate-500">{preset.layers?.join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

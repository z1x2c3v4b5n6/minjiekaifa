import { useEffect, useState } from 'react'
import { moodAPI, statsAPI } from '../api'

const StatsPage = () => {
  const [overview, setOverview] = useState({ daily: [], category_stats: {} })
  const [moods, setMoods] = useState([])

  useEffect(() => {
    statsAPI.overview().then((res) => setOverview(res.data))
    moodAPI.recent().then((res) => setMoods(res.data))
  }, [])

  return (
    <div className="grid two">
      <div className="card">
        <div className="card-header">最近 7 天专注</div>
        <div className="bars">
          {overview.daily.map((item) => (
            <div key={item.day} className="bar">
              <div className="bar-fill" style={{ height: `${Math.min(item.total, 300)}px` }} />
              <span className="bar-label">{item.day}</span>
              <span className="bar-value">{item.total}m</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header">情绪时间轴</div>
        <ul className="mood-list">
          {moods.map((m) => (
            <li key={m.id}>
              <strong>{m.date}</strong> - 情绪：{m.mood} - {m.note}
            </li>
          ))}
          {!moods.length && <div className="muted">暂无记录</div>}
        </ul>
      </div>
    </div>
  )
}

export default StatsPage

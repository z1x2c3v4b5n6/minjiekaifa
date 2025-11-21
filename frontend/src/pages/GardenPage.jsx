import { useEffect, useState } from 'react'
import { gardenAPI } from '../api'

const GardenPage = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    gardenAPI.overview().then((res) => setData(res.data))
  }, [])

  if (!data) return <div className="card">加载中...</div>

  return (
    <div className="card">
      <div className="card-header">我的花园</div>
      <p>总番茄：{data.total_pomodoros}</p>
      <p>本周番茄：{data.weekly_pomodoros}</p>
      <p>成长阶段：{data.level}</p>
      <div className="garden-grid">
        {Object.entries(data.category_stats || {}).map(([cat, val]) => (
          <div key={cat} className="garden-tile">
            <div className="tile-icon">🌱</div>
            <div>{cat}</div>
            <div className="muted">{val} 分钟</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GardenPage

import { useEffect, useState } from 'react'
import { statsAPI } from '../api'

const TodayStats = () => {
  const [stats, setStats] = useState({ today_minutes: 0, today_pomodoros: 0 })

  const load = async () => {
    const res = await statsAPI.today()
    setStats(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="card">
      <div className="card-header">今日统计</div>
      <p>专注分钟：{stats.today_minutes}</p>
      <p>番茄数量：{stats.today_pomodoros}</p>
      <button className="secondary" onClick={load}>
        刷新
      </button>
    </div>
  )
}

export default TodayStats

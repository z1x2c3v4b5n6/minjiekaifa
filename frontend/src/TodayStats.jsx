import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

function TodayStats() {
  const [todayMinutes, setTodayMinutes] = useState(0)

  const fetchStats = async () => {
    const res = await axios.get(`${API_BASE}/stats/today/`)
    setTodayMinutes(res.data.today_minutes)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return <div>今日专注：{todayMinutes} 分钟</div>
}

export default TodayStats

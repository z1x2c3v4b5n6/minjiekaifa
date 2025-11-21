import TaskList from '../components/TaskList'
import PomodoroTimer from '../components/PomodoroTimer'
import TodayStats from '../components/TodayStats'
import { useEffect, useState } from 'react'
import { authAPI } from '../api'

const Dashboard = () => {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    authAPI.profile().then((res) => setProfile(res.data))
  }, [])

  return (
    <div className="grid two">
      <TaskList filterToday />
      <div className="stack">
        <PomodoroTimer defaultMinutes={profile?.default_focus_minutes || 25} defaultScene={profile?.default_scene || 'rain'} />
        <TodayStats />
      </div>
    </div>
  )
}

export default Dashboard

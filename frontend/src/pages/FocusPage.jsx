import { useEffect, useState } from 'react'
import PomodoroTimer from '../components/PomodoroTimer'
import { taskAPI, authAPI } from '../api'

const FocusPage = () => {
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    taskAPI.list().then((res) => setTasks(res.data))
    authAPI.profile().then((res) => setProfile(res.data))
  }, [])

  return (
    <div className="focus-page">
      <h2>全屏专注</h2>
      <div className="card">
        <div className="card-header">选择任务</div>
        <select value={selected || ''} onChange={(e) => setSelected(e.target.value || null)}>
          <option value="">无关联任务</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      <PomodoroTimer
        defaultMinutes={profile?.default_focus_minutes || 25}
        defaultScene={profile?.default_scene || 'rain'}
        taskId={selected}
      />
    </div>
  )
}

export default FocusPage

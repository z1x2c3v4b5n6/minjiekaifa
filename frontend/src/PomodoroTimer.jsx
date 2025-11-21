import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'
const DEFAULT_SECONDS = 10 // 演示用 10 秒
const DEMO_MINUTES = 25 // 提交给后端的分钟数，演示用 25 分钟

function PomodoroTimer() {
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SECONDS)
  const [running, setRunning] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          handleFinish()
          return DEFAULT_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleFinish = async () => {
    await axios.post(`${API_BASE}/sessions/`, {
      task: selectedTaskId ? Number(selectedTaskId) : null,
      duration_minutes: DEMO_MINUTES,
    })
  }

  const handleStart = () => {
    setRemainingSeconds(DEFAULT_SECONDS)
    setRunning(true)
  }

  return (
    <div>
      <div style={{ fontSize: '48px', textAlign: 'center', margin: '16px 0' }}>
        {remainingSeconds}s
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          placeholder="关联任务 ID（可选）"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleStart} disabled={running} style={{ padding: '8px 16px' }}>
          {running ? '计时中...' : '开始专注'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '14px' }}>
        演示：倒计时 {DEFAULT_SECONDS} 秒，结束后向后端记录 {DEMO_MINUTES} 分钟专注。
      </p>
    </div>
  )
}

export default PomodoroTimer

import { useEffect, useRef, useState } from 'react'
import { sessionAPI } from '../api'

const audioSources = {
  rain: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_24388bb9bd.mp3?filename=rain-ambient-110118.mp3',
  sea: 'https://cdn.pixabay.com/download/audio/2022/03/16/audio_bf9f6c5a1a.mp3?filename=waves-ambient-113173.mp3',
  cafe: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_9c3161e357.mp3?filename=coffee-shop-ambience-6100.mp3',
}

const PomodoroTimer = ({ defaultMinutes = 25, taskId = null, defaultScene = 'rain', onFinished }) => {
  const [seconds, setSeconds] = useState(defaultMinutes * 60)
  const [running, setRunning] = useState(false)
  const [scene, setScene] = useState(defaultScene)
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    setSeconds(defaultMinutes * 60)
  }, [defaultMinutes])

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          finish(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    playAudio()
    return () => clearInterval(timerRef.current)
  }, [running])

  const playAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSources[scene])
      audioRef.current.loop = true
    }
    audioRef.current.play().catch(() => {})
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const start = () => {
    setSeconds(defaultMinutes * 60)
    setRunning(true)
  }

  const pause = () => {
    setRunning(false)
    clearInterval(timerRef.current)
    stopAudio()
  }

  const finish = async (completed) => {
    setRunning(false)
    clearInterval(timerRef.current)
    stopAudio()
    await sessionAPI.create({
      task: taskId,
      duration_minutes: defaultMinutes,
      is_completed: completed,
      interrupted_reason: completed ? '' : '用户中止',
    })
    setSeconds(defaultMinutes * 60)
    onFinished && onFinished()
  }

  const minutesDisplay = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secondsDisplay = String(seconds % 60).padStart(2, '0')

  return (
    <div className="card">
      <div className="card-header">番茄计时器</div>
      <div className="timer-display">{minutesDisplay}:{secondsDisplay}</div>
      <label>
        环境音：
        <select value={scene} onChange={(e) => setScene(e.target.value)}>
          <option value="rain">雨声</option>
          <option value="sea">海浪</option>
          <option value="cafe">咖啡厅</option>
        </select>
      </label>
      <div className="timer-actions">
        {!running && <button onClick={start}>开始</button>}
        {running && <button className="secondary" onClick={pause}>暂停</button>}
        {running && (
          <button className="danger" onClick={() => finish(false)}>
            中断
          </button>
        )}
      </div>
    </div>
  )
}

export default PomodoroTimer

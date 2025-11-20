import TaskList from './TaskList'
import PomodoroTimer from './PomodoroTimer'
import TodayStats from './TodayStats'

const containerStyle = {
  display: 'flex',
  gap: '24px',
  padding: '24px',
  minHeight: '100vh',
  background: '#f2f5f7',
  fontFamily: 'Arial, sans-serif'
}

const columnStyle = {
  flex: 1,
  background: '#fff',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

function App() {
  return (
    <div style={containerStyle}>
      <div style={columnStyle}>
        <h2>任务列表</h2>
        <TaskList />
      </div>
      <div style={columnStyle}>
        <h2>番茄计时器</h2>
        <PomodoroTimer />
        <hr style={{ margin: '16px 0' }} />
        <TodayStats />
      </div>
    </div>
  )
}

export default App

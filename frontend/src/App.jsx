import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { authAPI, setToken } from './api'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import FocusPage from './pages/FocusPage'
import GardenPage from './pages/GardenPage'
import StatsPage from './pages/StatsPage'
import ProfilePage from './pages/ProfilePage'

const NavBar = ({ onLogout }) => {
  return (
    <header className="navbar">
      <div className="logo">TimeGarden</div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/tasks">任务</Link>
        <Link to="/focus">专注</Link>
        <Link to="/garden">花园</Link>
        <Link to="/stats">统计</Link>
        <Link to="/profile">个人中心</Link>
      </nav>
      <button className="secondary" onClick={onLogout}>
        退出
      </button>
    </header>
  )
}

const RequireAuth = ({ children, authed }) => {
  const location = useLocation()
  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('tg_token'))
  const navigate = useNavigate()

  useEffect(() => {
    setAuthed(!!localStorage.getItem('tg_token'))
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (e) {
      console.error(e)
    }
    setToken(null)
    setAuthed(false)
    navigate('/login')
  }

  return (
    <div className="app">
      {authed && <NavBar onLogout={handleLogout} />}
      <main className="content">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={() => setAuthed(true)} />} />
          <Route
            path="/"
            element={
              <RequireAuth authed={authed}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequireAuth authed={authed}>
                <TasksPage />
              </RequireAuth>
            }
          />
          <Route
            path="/focus"
            element={
              <RequireAuth authed={authed}>
                <FocusPage />
              </RequireAuth>
            }
          />
          <Route
            path="/garden"
            element={
              <RequireAuth authed={authed}>
                <GardenPage />
              </RequireAuth>
            }
          />
          <Route
            path="/stats"
            element={
              <RequireAuth authed={authed}>
                <StatsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth authed={authed}>
                <ProfilePage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App

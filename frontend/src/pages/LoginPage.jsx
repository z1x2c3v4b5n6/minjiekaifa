import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, setToken } from '../api'

const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const action = mode === 'login' ? authAPI.login : authAPI.register
      const res = await action(form)
      setToken(res.data.token)
      onLogin()
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || '请求失败')
    }
  }

  return (
    <div className="center-card">
      <h2>{mode === 'login' ? '登录' : '注册'}</h2>
      <form onSubmit={submit} className="form">
        <input
          placeholder="用户名"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          placeholder="密码"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {mode === 'register' && (
          <input
            placeholder="昵称（可选）"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          />
        )}
        {error && <div className="error">{error}</div>}
        <button type="submit">{mode === 'login' ? '登录' : '注册'}</button>
      </form>
      <p>
        {mode === 'login' ? '没有账号？' : '已有账号？'}
        <button className="link-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '去注册' : '去登录'}
        </button>
      </p>
    </div>
  )
}

export default LoginPage

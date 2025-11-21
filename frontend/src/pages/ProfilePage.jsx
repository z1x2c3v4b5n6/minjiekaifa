import { useEffect, useState } from 'react'
import { authAPI } from '../api'

const ProfilePage = () => {
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    authAPI.profile().then((res) => setProfile(res.data))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    await authAPI.updateProfile(profile)
    setMessage('保存成功')
    setTimeout(() => setMessage(''), 1500)
  }

  if (!profile) return <div className="card">加载中...</div>

  return (
    <div className="card">
      <div className="card-header">个人中心</div>
      <form className="form" onSubmit={save}>
        <input value={profile.nickname || ''} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} placeholder="昵称" />
        <input value={profile.avatar || ''} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="头像 URL" />
        <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="签名" />
        <label>默认专注时长（分钟）</label>
        <input
          type="number"
          value={profile.default_focus_minutes}
          onChange={(e) => setProfile({ ...profile, default_focus_minutes: parseInt(e.target.value) })}
        />
        <label>短休 / 长休（分钟）</label>
        <div className="grid two">
          <input
            type="number"
            value={profile.default_short_break_minutes}
            onChange={(e) => setProfile({ ...profile, default_short_break_minutes: parseInt(e.target.value) })}
          />
          <input
            type="number"
            value={profile.default_long_break_minutes}
            onChange={(e) => setProfile({ ...profile, default_long_break_minutes: parseInt(e.target.value) })}
          />
        </div>
        <label>默认环境音</label>
        <select value={profile.default_scene} onChange={(e) => setProfile({ ...profile, default_scene: e.target.value })}>
          <option value="rain">雨声</option>
          <option value="sea">海浪</option>
          <option value="cafe">咖啡厅</option>
        </select>
        <button type="submit">保存</button>
        {message && <div className="success">{message}</div>}
      </form>
    </div>
  )
}

export default ProfilePage

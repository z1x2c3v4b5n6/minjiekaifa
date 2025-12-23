import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

function TaskList() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({ title: '', category: '', estimated_pomodoros: '' })

  const fetchTasks = async () => {
    const res = await axios.get(`${API_BASE}/tasks/`)
    setTasks(res.data)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    await axios.post(`${API_BASE}/tasks/`, {
      title: form.title,
      category: form.category,
      estimated_pomodoros: form.estimated_pomodoros ? parseInt(form.estimated_pomodoros, 10) : null,
    })
    setForm({ title: '', category: '', estimated_pomodoros: '' })
    fetchTasks()
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input
          name="title"
          placeholder="任务标题"
          value={form.title}
          onChange={handleChange}
          required
          style={{ flex: '1 0 200px', padding: '8px' }}
        />
        <input
          name="category"
          placeholder="分类（可选）"
          value={form.category}
          onChange={handleChange}
          style={{ flex: '1 0 140px', padding: '8px' }}
        />
        <input
          name="estimated_pomodoros"
          type="number"
          placeholder="预计番茄数"
          value={form.estimated_pomodoros}
          onChange={handleChange}
          style={{ width: '120px', padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 12px' }}>
          添加任务
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tasks.map((task) => (
          <li key={task.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 'bold' }}>{task.title}</div>
            <div style={{ fontSize: '12px', color: '#555' }}>
              分类: {task.category || '无'} | 预计番茄: {task.estimated_pomodoros ?? '未填'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TaskList

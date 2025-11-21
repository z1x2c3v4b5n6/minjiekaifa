import { useEffect, useState } from 'react'
import { taskAPI } from '../api'

const TaskList = ({ filterToday = false }) => {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({ title: '', category: '', estimated_pomodoros: '', status: 'todo' })

  const load = async () => {
    const res = await taskAPI.list(filterToday ? { is_today: true } : {})
    setTasks(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    await taskAPI.create({
      ...form,
      estimated_pomodoros: form.estimated_pomodoros ? parseInt(form.estimated_pomodoros) : null,
    })
    setForm({ title: '', category: '', estimated_pomodoros: '', status: 'todo' })
    load()
  }

  const toggleStatus = async (task) => {
    const order = ['todo', 'doing', 'done']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    await taskAPI.update(task.id, { status: next })
    load()
  }

  const toggleToday = async (task) => {
    await taskAPI.toggleToday(task.id)
    load()
  }

  const remove = async (id) => {
    await taskAPI.remove(id)
    load()
  }

  return (
    <div className="card">
      <div className="card-header">{filterToday ? '今日任务' : '任务列表'}</div>
      <form onSubmit={submit} className="form-inline">
        <input
          placeholder="标题"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="分类"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          type="number"
          placeholder="预计番茄"
          value={form.estimated_pomodoros}
          onChange={(e) => setForm({ ...form, estimated_pomodoros: e.target.value })}
        />
        <button type="submit">添加</button>
      </form>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className={`task status-${t.status}`}>
            <div>
              <strong>{t.title}</strong> <span className="pill">{t.category || '未分类'}</span>
              {t.is_today && <span className="pill today">今日</span>}
              <div className="muted">番茄：{t.estimated_pomodoros || '-'} | 状态：{t.status}</div>
            </div>
            <div className="task-actions">
              <button className="secondary" onClick={() => toggleStatus(t)}>
                状态切换
              </button>
              <button className="secondary" onClick={() => toggleToday(t)}>
                {t.is_today ? '移出今日' : '加入今日'}
              </button>
              <button className="danger" onClick={() => remove(t.id)}>
                删除
              </button>
            </div>
          </li>
        ))}
        {!tasks.length && <div className="muted">暂无任务</div>}
      </ul>
    </div>
  )
}

export default TaskList

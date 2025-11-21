import { useEffect, useState } from 'react'
import { taskAPI } from '../api'

const TasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState('')

  const load = async () => {
    const res = await taskAPI.list({ status: filter || undefined, category: category || undefined })
    setTasks(res.data)
  }

  useEffect(() => {
    load()
  }, [filter, category])

  const toggleToday = async (task) => {
    await taskAPI.toggleToday(task.id)
    load()
  }

  const updateStatus = async (task, status) => {
    await taskAPI.update(task.id, { status })
    load()
  }

  const remove = async (task) => {
    await taskAPI.remove(task.id)
    load()
  }

  return (
    <div className="card">
      <div className="card-header">任务管理</div>
      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="todo">待办</option>
          <option value="doing">进行中</option>
          <option value="done">已完成</option>
        </select>
        <input placeholder="分类过滤" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button className="secondary" onClick={load}>
          刷新
        </button>
      </div>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className={`task status-${t.status}`}>
            <div>
              <strong>{t.title}</strong> <span className="pill">{t.category || '未分类'}</span>
              {t.is_today && <span className="pill today">今日</span>}
              <div className="muted">番茄：{t.estimated_pomodoros || '-'} | 状态：{t.status}</div>
            </div>
            <div className="task-actions">
              <select value={t.status} onChange={(e) => updateStatus(t, e.target.value)}>
                <option value="todo">todo</option>
                <option value="doing">doing</option>
                <option value="done">done</option>
              </select>
              <button className="secondary" onClick={() => toggleToday(t)}>
                {t.is_today ? '移出今日' : '加入今日'}
              </button>
              <button className="danger" onClick={() => remove(t)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TasksPage

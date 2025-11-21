import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tg_token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('tg_token', token)
  } else {
    localStorage.removeItem('tg_token')
  }
}

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  profile: () => api.get('/profile/'),
  updateProfile: (data) => api.put('/profile/', data),
}

export const taskAPI = {
  list: (params) => api.get('/tasks/', { params }),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  remove: (id) => api.delete(`/tasks/${id}/`),
  toggleToday: (id) => api.post(`/tasks/${id}/set_today/`),
}

export const sessionAPI = {
  list: () => api.get('/sessions/'),
  create: (data) => api.post('/sessions/', data),
}

export const statsAPI = {
  today: () => api.get('/stats/today/'),
  overview: () => api.get('/stats/overview/'),
}

export const moodAPI = {
  today: () => api.get('/moods/today/'),
  saveToday: (data) => api.post('/moods/today/', data),
  recent: () => api.get('/moods/recent/'),
}

export const gardenAPI = {
  overview: () => api.get('/garden/overview/'),
}

export default api

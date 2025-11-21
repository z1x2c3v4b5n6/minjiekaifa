# TimeGarden Focus System

一个可以直接运行的「时光花园专注管理平台」MVP，后端 Django + DRF（Token 认证 + SQLite），前端 Vite + React。包含用户注册/登录、任务管理、番茄专注记录、情绪日记、统计与花园视图。

## 目录结构
- `backend/`：Django 项目（`timegarden`）与核心应用 `core`
- `frontend/`：Vite + React 前端

## 后端使用方法
```bash
cd backend
# 安装依赖（建议虚拟环境）
pip install -r requirements.txt

# 生成数据库并创建表
python manage.py makemigrations
python manage.py migrate

# 启动开发服务器
python manage.py runserver 0.0.0.0:8000
```

### 关键配置
- `timegarden/settings.py`：开启 `rest_framework`、`rest_framework.authtoken`，默认 Token + Session 认证，已开启 `CORS_ALLOW_ALL_ORIGINS = True`
- `core/models.py`：UserProfile、Task、FocusSession、MoodRecord 模型
- `core/views.py` & `core/urls.py`：认证/资料、任务 CRUD、番茄记录、统计、情绪、花园接口

### 主要 API
- 认证：`POST /api/auth/register/`、`POST /api/auth/login/`（返回 token）、`POST /api/auth/logout/`
- 资料：`GET/PUT /api/profile/`
- 任务：`GET/POST /api/tasks/`、`PATCH/DELETE /api/tasks/<id>/`、`POST /api/tasks/<id>/set_today/`
- 番茄：`GET/POST /api/sessions/`
- 统计：`GET /api/stats/today/`、`GET /api/stats/overview/`
- 情绪：`GET/POST /api/moods/today/`、`GET /api/moods/recent/`
- 花园：`GET /api/garden/overview/`
- 根路径：`GET /` 返回 `{"message": "TimeGarden API is running"}`

## 前端使用方法
```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```
默认调用 `http://localhost:8000/api`，如果需要改动可在 `src/api.js` 中调整 `API_BASE`。

### 前端页面
- `/login` 登录/注册（保存 Token 到 localStorage）
- `/` Dashboard：今日任务 + 番茄计时器 + 今日统计
- `/tasks` 任务管理：筛选、更新状态、删除、加入今日计划
- `/focus` 全屏专注：选择任务并倒计时，结束后写入专注记录
- `/garden` 花园视图：展示总/周番茄与分类色块
- `/stats` 统计与情绪：最近 7 天专注条形展示 + 情绪时间轴
- `/profile` 个人中心：编辑昵称、签名、头像、默认番茄时长与环境音

### 运行示例步骤
1. 启动后端：`python manage.py runserver 0.0.0.0:8000`
2. 启动前端：`npm run dev -- --host --port 5173`
3. 打开 `http://localhost:5173/login` 注册/登录后体验各页面，番茄计时器结束会自动向后端写入专注记录。

## CORS 说明
已安装并启用 `django-cors-headers`，默认允许所有来源，部署时可改为：
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000']
```

# TimeGarden Focus System

一个最小可运行的「时光花园专注管理平台」示例，后端使用 Django + Django REST Framework，前端使用 Vite + React。功能包含任务管理、番茄计时记录以及今日专注时长统计。

## 目录结构
- `backend/`：Django 项目（`timegarden`）与核心应用 `core`
- `frontend/`：Vite + React 前端

## 后端快速开始
```bash
cd backend
# 安装依赖（建议使用虚拟环境）
pip install -r requirements.txt

# 生成数据库并启动
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 关键文件
- `core/models.py`：定义 Task 与 FocusSession 模型
- `core/serializers.py`：DRF 序列化器
- `core/views.py` & `core/urls.py`：任务、专注记录、今日统计接口
- `timegarden/settings.py`：已启用 DRF、SQLite、CORS（默认允许所有来源）

启动后，API 主要路由：
- `GET /api/tasks/` 列出任务
- `POST /api/tasks/` 新建任务
- `GET /api/sessions/` 列出专注记录
- `POST /api/sessions/` 新建专注记录
- `GET /api/stats/today/` 今日专注分钟数
- `GET /` 健康检查（返回 JSON）

## 前端快速开始
```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```
默认后端地址为 `http://localhost:8000/api`。如果需要修改，可在前端各组件中的 `API_BASE` 常量调整。

## CORS 说明
后端已安装并启用 `django-cors-headers`，在 `timegarden/settings.py` 中默认配置了 `CORS_ALLOW_ALL_ORIGINS = True`，便于本地开发。如果需要限制来源，可将其改为 `CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000']`。

## 示例工作流
1. 先启动后端 `python manage.py runserver 0.0.0.0:8000`
2. 前端运行 `npm run dev -- --host --port 5173`
3. 打开浏览器访问 `http://localhost:5173`
4. 左侧创建任务，右侧启动 10 秒演示的番茄计时，结束后会向后端提交一条 25 分钟的专注记录，并可通过「今日专注」查看总和。


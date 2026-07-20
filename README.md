# TimeGarden Focus System

TimeGarden 是一个全栈个人效率平台，串联“任务规划 → 专注执行 → 结束反馈 → 数据复盘 → 次日调整”，并用可视化花园提供长期正反馈。

## 核心功能

- Token 注册登录、个人偏好与角色权限
- 任务 CRUD、今日计划、截止日期、番茄预估和实际进度
- 子任务、明日迁移、预计/实际偏差和目标达成确认
- 番茄工作流、环境音、短/长休息
- 专注质量、暂停次数、中断类型和备注反馈
- 幂等提交、任务归属与时长校验
- 日/周/月专注花园和成长记录
- 植物成长阶段、成长图鉴与专注记录详情
- 7/30/90 天趋势、分类占比、高效时段、完成率与 CSV 导出
- 情绪记录、每日复盘、管理员看板、公告和环境音管理

## 技术栈

- 后端：Python、Django、Django REST Framework、SQLite
- 前端：React 18、React Router、Axios、Tailwind CSS、Vite
- 部署：Waitress、WhiteNoise
- 测试：DRF APITestCase，覆盖专注闭环、幂等性和权限边界
- 工程化：计时恢复、Error Boundary、Docker、GitHub Actions

## 本地运行

要求 Python 3.11+、Node.js 18+。

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
# 仅本地演示需要：创建普通用户和管理员测试账号
python manage.py seed_demo_users
python manage.py runserver
```

另开终端：

```bash
cd frontend
npm install
npm run dev
```

打开 `http://localhost:5173`。

开发模式登录页提供两个仅用于本地演示的账号。它们不会由生产迁移自动创建，需要先执行 `python manage.py seed_demo_users`：

- 普通用户：`demo_user` / `timegarden123`
- 管理员：`demo_admin` / `admin123456`

生产构建不会显示测试账号入口，请勿在生产环境执行该命令。

如果前端提示无法连接服务器，请确认 Django 正在 `127.0.0.1:8000` 运行，并在修改 Vite 配置后重新执行 `npm run dev`。

## 验证与构建

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test

cd ../frontend
npm run build
```

前端生产构建输出到 `backend/static/app/`。

也可以使用 Docker 启动：

```bash
docker compose up --build
```

## 核心业务闭环

1. 创建任务，填写预计番茄数并加入今日计划。
2. 从任务页直接进入专注页，自动关联对应任务。
3. 完成后填写质量；提前结束时补充结构化中断原因。
4. 后端原子写入专注记录和花园条目，更新任务实际进度。
5. 统计页结合完成率、质量和中断来源生成行动建议。
6. 用户完成每日复盘，为次日目标保留上下文。

## 核心 API

- `POST /api/auth/register/`、`POST /api/auth/login/`
- `GET/POST /api/tasks/`、`PATCH /api/tasks/<id>/`
- `GET/POST /api/sessions/`
- `GET /api/stats/today/`、`GET /api/stats/overview/`、`GET /api/stats/insights/`
- `GET/POST /api/moods/today/`
- `GET/PUT /api/reviews/today/`
- `GET /api/garden/overview/`、`GET /api/garden/items/`

## 生产配置

```text
TIMEGARDEN_DEBUG=false
TIMEGARDEN_SECRET_KEY=<strong-random-secret>
TIMEGARDEN_ALLOWED_HOSTS=example.com
TIMEGARDEN_CORS_ORIGINS=https://example.com
TIMEGARDEN_DATA_DIR=<persistent-data-directory>
```

生产环境不默认开放全部 CORS。SQLite 适合单机展示和轻量部署；高并发场景建议迁移到 PostgreSQL。

## 设计与面试材料

- [系统架构与面试说明](docs/ARCHITECTURE.md)
- [API 摘要](docs/API.md)

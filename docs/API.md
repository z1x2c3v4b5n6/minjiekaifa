# API 摘要

除注册和登录外，请求使用 `Authorization: Token <token>`。

| 模块 | 方法与路径 | 说明 |
|---|---|---|
| 认证 | `POST /api/auth/register/` | 注册并返回 Token |
| 任务 | `GET/POST /api/tasks/` | 查询或创建任务/子任务 |
| 任务 | `POST /api/tasks/{id}/move_tomorrow/` | 迁移到明天 |
| 任务 | `POST /api/tasks/{id}/complete/` | 完成任务 |
| 专注 | `POST /api/sessions/` | 幂等创建记录并更新任务与花园 |
| 花园 | `GET /api/garden/items/` | 按日/周/月查询植物 |
| 统计 | `GET /api/stats/insights/` | 行动建议和扩展指标 |
| 导出 | `GET /api/stats/export/` | 导出个人 CSV |
| 复盘 | `GET/PUT /api/reviews/today/` | 今日复盘 |
| 计划 | `GET /api/reviews/context/` | 昨日复盘回流今日 |

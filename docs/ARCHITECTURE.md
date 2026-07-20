# 系统架构与面试说明

## 核心链路

```text
任务规划 → 专注计时 → FocusSession
                  ├→ 原子更新 Task 进度
                  ├→ 生成 GardenItem
                  └→ 统计、复盘与次日计划
```

前端由 React Router 组织用户端和管理端页面，Axios 统一处理 Token 与超时。后端采用 Django REST Framework，所有用户数据查询均以当前认证用户过滤。

## 数据关系

```text
User 1—1 UserProfile
User 1—N Task 1—N Subtask
User 1—N FocusSession N—1 Task
FocusSession 1—1 GardenItem
User 1—N MoodRecord
User 1—N DailyReview
```

## 可重点讲解的实现

1. `client_session_id` 与数据库唯一约束保证专注提交幂等。
2. 专注记录、任务进度和花园条目在数据库事务中更新。
3. 浏览器使用结束时间戳计算剩余时间，避免后台节流造成计时漂移。
4. 计时状态保存在 localStorage，刷新后可以恢复或继续暂停状态。
5. 复盘中的次日目标只在第二天回流首页，避免陈旧建议长期出现。
6. 任务、父任务和专注关联都校验用户归属，避免越权访问。

## 三分钟介绍结构

- 30 秒：项目解决“计划、执行和复盘割裂”的问题。
- 60 秒：展示任务开始专注、结束反馈、任务进度与花园同步。
- 45 秒：展示统计建议、每日复盘和第二天首页回流。
- 45 秒：说明幂等、事务、权限校验、可靠计时、测试和 CI。

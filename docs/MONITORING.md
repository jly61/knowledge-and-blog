# 监控告警系统文档

## 概述

本项目集成了完整的监控告警系统，包括：
- **错误追踪**：使用 Sentry 捕获和追踪错误
- **性能监控**：监控 API 路由和 Server Actions 的性能
- **日志系统**：统一的日志记录接口
- **告警通知**：支持邮件和 Webhook 通知

## 功能特性

### 1. Sentry 错误追踪

Sentry 用于捕获和追踪应用中的错误，包括：
- 客户端错误（浏览器端）
- 服务端错误（Next.js API 路由、Server Actions）
- Edge Runtime 错误

#### 配置

1. **创建 Sentry 项目**
   - 访问 [Sentry](https://sentry.io) 并创建账户
   - 创建新项目，选择 "Next.js"
   - 获取 DSN（Data Source Name）

2. **配置环境变量**

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx  # 可选，服务端专用
SENTRY_ORG=your-org-name  # 可选，用于上传源映射
SENTRY_PROJECT=your-project-name  # 可选，用于上传源映射
```

3. **验证配置**

运行应用后，Sentry 会自动捕获错误。你可以在 Sentry 仪表板中查看：
- 错误详情和堆栈跟踪
- 错误发生频率
- 用户影响范围
- 性能数据

### 2. 自定义日志系统

使用 `lib/monitoring/logger.ts` 提供的统一日志接口：

```typescript
import { logger } from "@/lib/monitoring/logger"

// 调试日志（仅开发环境）
logger.debug("调试信息", { userId: "123" })

// 信息日志
logger.info("操作完成", { action: "createNote" })

// 警告日志
logger.warn("性能警告", { duration: 1500 })

// 错误日志
logger.error("操作失败", error, { context: "additional info" })

// 性能监控
logger.performance("数据库查询", 250, { query: "findMany" })
```

**特性：**
- 开发环境：输出到控制台
- 生产环境：错误和警告自动发送到 Sentry
- 统一的日志格式
- 支持上下文信息

### 3. 性能监控

使用 `lib/monitoring/performance.ts` 监控操作性能：

```typescript
import { withPerformanceMonitoring, measurePerformanceAsync } from "@/lib/monitoring/performance"

// 方式 1: 装饰器模式
const createNote = withPerformanceMonitoring(
  async (data: CreateNoteData) => {
    // 你的代码
  },
  "createNote"
)

// 方式 2: 包装器模式
const result = await measurePerformanceAsync("databaseQuery", async () => {
  return await db.note.findMany()
})

// 方式 3: 手动监控
const monitor = new PerformanceMonitor("complexOperation")
// ... 执行操作
monitor.end({ recordsProcessed: 100 })
```

**自动功能：**
- 记录操作耗时
- 超过阈值时自动记录警告
- 错误时记录性能数据

### 4. 告警通知

使用 `lib/monitoring/alerts.ts` 发送告警通知：

```typescript
import { sendAlert, alertError, alertCritical } from "@/lib/monitoring/alerts"

// 发送自定义告警
await sendAlert({
  level: "error",
  title: "数据库连接失败",
  message: "无法连接到 PostgreSQL 数据库",
  context: { error: error.message },
  tags: { component: "database" },
})

// 发送错误告警
await alertError("API 错误", "用户创建失败", error, { userId: "123" })

// 发送关键错误告警
await alertCritical("系统故障", "数据库完全不可用")
```

#### 配置邮件通知

```bash
# .env.local
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_RECIPIENT=admin@example.com
EMAIL_SERVICE_URL=https://api.email-service.com/send
EMAIL_SERVICE_API_KEY=your-api-key
```

#### 配置 Webhook 通知

```bash
# .env.local
ALERT_WEBHOOK_URL=https://hooks.example.com/alerts
```

Webhook 负载格式：
```json
{
  "level": "error",
  "title": "错误标题",
  "message": "错误消息",
  "context": { "additional": "data" },
  "tags": { "component": "database" },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 5. 健康检查端点

访问 `/api/monitoring/health` 检查系统状态：

```bash
curl https://your-domain.com/api/monitoring/health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "duration": 45,
  "checks": {
    "database": {
      "status": "ok",
      "duration": 12
    },
    "environment": {
      "status": "ok"
    }
  }
}
```

## 使用示例

### 在 Server Action 中使用

```typescript
"use server"

import { logger } from "@/lib/monitoring/logger"
import { withPerformanceMonitoring } from "@/lib/monitoring/performance"
import { alertError } from "@/lib/monitoring/alerts"

export const createNote = withPerformanceMonitoring(
  async (data: CreateNoteData) => {
    try {
      logger.info("Creating note", { title: data.title })
      const note = await db.note.create({ data })
      logger.info("Note created successfully", { noteId: note.id })
      return note
    } catch (error) {
      logger.error("Failed to create note", error, { data })
      await alertError("笔记创建失败", "数据库操作错误", error as Error, { data })
      throw error
    }
  },
  "createNote"
)
```

### 在 API 路由中使用

```typescript
import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/monitoring/logger"
import { measurePerformanceAsync } from "@/lib/monitoring/performance"

export async function GET(request: NextRequest) {
  try {
    const data = await measurePerformanceAsync("fetchData", async () => {
      return await db.post.findMany()
    })
    return NextResponse.json(data)
  } catch (error) {
    logger.error("API route error", error, { path: request.nextUrl.pathname })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 最佳实践

1. **错误处理**
   - 始终使用 `logger.error()` 记录错误
   - 提供足够的上下文信息
   - 对于关键错误，使用 `alertError()` 发送告警

2. **性能监控**
   - 监控所有数据库查询
   - 监控外部 API 调用
   - 设置合理的性能阈值

3. **日志级别**
   - `debug`: 详细的调试信息（仅开发环境）
   - `info`: 一般信息（操作成功、状态变更等）
   - `warn`: 警告信息（性能问题、配置问题等）
   - `error`: 错误信息（操作失败、异常等）

4. **告警策略**
   - 仅对关键错误发送告警（避免告警疲劳）
   - 使用合适的告警级别
   - 配置合理的告警阈值

## 监控仪表板

### Sentry 仪表板

访问 [Sentry Dashboard](https://sentry.io) 查看：
- 错误趋势
- 性能指标
- 用户影响
- 发布跟踪

### Vercel Analytics

如果使用 Vercel 部署，可以启用 Vercel Analytics：
- 访问 Vercel 项目设置
- 启用 Analytics
- 查看实时性能数据

## 故障排查

### Sentry 未捕获错误

1. 检查 `NEXT_PUBLIC_SENTRY_DSN` 是否配置
2. 检查网络连接（Sentry 需要访问外网）
3. 查看浏览器控制台是否有 Sentry 初始化错误

### 日志未输出

1. 开发环境：检查控制台
2. 生产环境：检查 Sentry 仪表板
3. 确认日志级别设置正确

### 告警未发送

1. 检查环境变量配置
2. 检查邮件服务/Webhook 服务是否可用
3. 查看日志确认告警是否被触发

## 相关文档

- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [项目部署文档](./DEPLOYMENT_ADVANCED.md)


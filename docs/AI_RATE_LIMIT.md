# AI 调用限流配置

## 概述

为了防止 DeepSeek/OpenAI API 被滥用，系统实现了调用限流功能。限流仅对 DeepSeek 和 OpenAI 生效，Ollama 本地模型不受限制。

## 限流规则

### 1. Token 限制

- **单次请求最大输入 Token 数**：默认 4000 tokens
- **单次请求最大输出 Token 数**：默认 2000 tokens

超过限制的请求会被拒绝，返回 429 错误。

### 2. 调用次数限制

- **每小时最大调用次数**：默认 50 次
- **每天最大调用次数**：默认 200 次

超过限制的请求会被拒绝，返回 429 错误。

### 3. 用户隔离

限流基于用户 ID 进行隔离：
- 已登录用户：基于用户 ID 独立限流
- 未登录用户：共享限流（基于 IP 或 session）

## 配置方法

在 `.env.local` 文件中添加以下环境变量：

```bash
# 是否启用限流（默认：true，设置为 false 可禁用限流）
AI_RATE_LIMIT_ENABLED=true

# 单次请求最大输入 Token 数（默认：4000）
AI_MAX_INPUT_TOKENS_PER_REQUEST=4000

# 单次请求最大输出 Token 数（默认：2000）
AI_MAX_OUTPUT_TOKENS_PER_REQUEST=2000

# 每小时最大调用次数（默认：50）
AI_MAX_CALLS_PER_HOUR=50

# 每天最大调用次数（默认：200）
AI_MAX_CALLS_PER_DAY=200
```

## 推荐配置

### 个人使用（低频率）

```bash
AI_MAX_INPUT_TOKENS_PER_REQUEST=2000
AI_MAX_OUTPUT_TOKENS_PER_REQUEST=1000
AI_MAX_CALLS_PER_HOUR=20
AI_MAX_CALLS_PER_DAY=100
```

### 团队使用（中等频率）

```bash
AI_MAX_INPUT_TOKENS_PER_REQUEST=4000
AI_MAX_OUTPUT_TOKENS_PER_REQUEST=2000
AI_MAX_CALLS_PER_HOUR=50
AI_MAX_CALLS_PER_DAY=200
```

### 高频率使用

```bash
AI_MAX_INPUT_TOKENS_PER_REQUEST=8000
AI_MAX_OUTPUT_TOKENS_PER_REQUEST=4000
AI_MAX_CALLS_PER_HOUR=100
AI_MAX_CALLS_PER_DAY=500
```

## Token 估算

系统使用简单的估算方法：
- **中文字符**：1.5 字符/token
- **英文字符**：4 字符/token

实际使用中，DeepSeek/OpenAI 的 token 计算可能略有不同，建议留出 20% 的余量。

## 错误响应

当超过限流时，API 会返回 429 状态码和错误信息：

```json
{
  "error": "每小时调用次数已达上限（50 次）。请稍后再试。"
}
```

或

```json
{
  "error": "输入文本过长，超过单次请求限制（4000 tokens）。当前：4500 tokens"
}
```

## 实现细节

### 存储方式

当前使用内存缓存存储使用记录，适合单实例部署。对于多实例部署，建议：

1. **使用 Redis**：修改 `lib/ai/rate-limit.ts`，将 `RateLimiter` 类改为使用 Redis
2. **使用数据库**：在数据库中创建使用记录表，定期清理过期数据

### 清理机制

系统每小时自动清理超过 24 小时的使用记录，避免内存占用过多。

## 监控和调试

可以通过以下方式查看限流状态：

```typescript
import { getRateLimiter } from "@/lib/ai/rate-limit"

const limiter = getRateLimiter()
const stats = limiter.getUsageStats(userId)

console.log({
  每小时调用次数: stats.hourlyCalls,
  每天调用次数: stats.dailyCalls,
  剩余每小时调用次数: stats.remainingHourlyCalls,
  剩余每天调用次数: stats.remainingDailyCalls,
})
```

## 注意事项

1. **限流仅对 DeepSeek/OpenAI 生效**：Ollama 本地模型不受限流限制
2. **内存限制**：使用内存缓存时，大量用户可能导致内存占用增加
3. **时间同步**：确保服务器时间准确，否则限流时间窗口可能不准确
4. **重启影响**：服务器重启后，内存中的使用记录会丢失，限流会重置

## 未来改进

- [ ] 支持 Redis 存储（多实例部署）
- [ ] 支持数据库存储（持久化）
- [ ] 添加管理界面查看使用统计
- [ ] 支持按功能类型分别限流（聊天、润色、SEO 等）
- [ ] 支持动态调整限流配置（无需重启）




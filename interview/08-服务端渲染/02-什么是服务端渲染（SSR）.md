# 什么是服务端渲染（SSR）

## 定义

**服务端渲染（Server-Side Rendering，SSR）** 是一种在服务器端生成完整 HTML 页面的技术。与传统的客户端渲染不同，SSR 在服务器上执行 JavaScript，将组件渲染成 HTML 字符串，然后直接发送给浏览器。

## 核心概念

### 1. 渲染时机

- **服务端渲染**：HTML 在服务器上生成，浏览器接收到的是完整的 HTML
- **客户端渲染**：浏览器接收到空的 HTML 骨架，然后通过 JavaScript 动态生成内容

### 2. 工作流程

```
1. 用户请求页面
   ↓
2. 服务器执行 JavaScript 代码
   ↓
3. 服务器渲染组件为 HTML 字符串
   ↓
4. 服务器返回完整的 HTML 页面
   ↓
5. 浏览器接收并显示页面
   ↓
6. JavaScript 在客户端"水合"（Hydration），使页面可交互
```

## 与传统渲染方式的对比

### 客户端渲染（CSR）

```html
<!-- 浏览器接收到的 HTML -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="app.js"></script>
  </body>
</html>
```

- 初始 HTML 几乎为空
- 需要下载并执行 JavaScript 才能看到内容
- 首屏加载时间较长

### 服务端渲染（SSR）

```html
<!-- 浏览器接收到的 HTML -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root">
      <h1>Hello World</h1>
      <p>这是服务端渲染的内容</p>
    </div>
    <script src="app.js"></script>
  </body>
</html>
```

- 初始 HTML 包含完整内容
- 用户可以立即看到页面内容
- JavaScript 加载后使页面可交互

## 技术实现

### React SSR 示例

```javascript
// 服务端代码
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

app.get('/', (req, res) => {
  const html = renderToString(<App />);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>SSR App</title></head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});
```

### Next.js 13+ SSR 示例（App Router）

Next.js 13+ 引入了 App Router，使用 Server Components 实现服务端渲染：

```javascript
// app/page.js
// 默认是 Server Component，在服务端执行
export default async function Home() {
  // 直接在组件中获取数据，无需 getServerSideProps
  const data = await fetchData();
  
  return (
    <div>
      <h1>服务端渲染的页面</h1>
      <p>数据：{data}</p>
    </div>
  );
}

// 数据获取函数
async function fetchData() {
  // 在服务端执行，可以直接访问数据库、API 等
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store', // 禁用缓存，每次请求都重新获取
  });
  return res.json();
}
```

**Next.js 13+ App Router 的特点：**

1. **Server Components（默认）**：
   - 组件默认在服务端渲染
   - 可以直接使用 `async/await` 获取数据
   - 不会发送到客户端，减少 JavaScript 包大小

2. **Client Components**：
   - 需要使用 `'use client'` 指令
   - 用于需要交互性的组件（如事件处理、状态管理）

```javascript
// app/components/InteractiveButton.js
'use client'; // 标记为 Client Component

import { useState } from 'react';

export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </button>
  );
}
```

3. **流式渲染**：
   - Next.js 13+ 支持流式 SSR
   - 可以逐步发送 HTML 内容，提升首屏性能

```javascript
// app/page.js
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>页面标题</h1>
      <Suspense fallback={<p>加载中...</p>}>
        <DataComponent />
      </Suspense>
    </div>
  );
}

async function DataComponent() {
  // 慢速数据获取，不会阻塞整个页面
  const data = await fetchSlowData();
  return <p>{data}</p>;
}
```


## 主要优势

### 1. SEO 友好

- 搜索引擎爬虫可以直接读取完整的 HTML 内容
- 不需要等待 JavaScript 执行
- 提高搜索引擎排名

### 2. 首屏加载速度快

- 用户立即看到内容，无需等待 JavaScript 下载和执行
- 改善用户体验，特别是对于慢速网络

### 3. 更好的性能指标

- 改善 **FCP（First Contentful Paint）**
- 改善 **LCP（Largest Contentful Paint）**
- 改善 **TTI（Time to Interactive）**

### 4. 社交媒体分享

- 社交媒体爬虫可以正确抓取页面元数据
- 分享链接时能正确显示预览信息

## 主要挑战

### 1. 服务器负载

- 每次请求都需要在服务器上执行渲染
- 增加服务器 CPU 和内存使用
- 需要更多的服务器资源

### 2. 复杂度增加

- 需要处理服务端和客户端的代码差异
- 某些浏览器 API 在服务端不可用
- 需要处理数据获取和状态同步

### 3. 水合问题

- 服务端和客户端渲染结果必须一致
- 水合不匹配会导致错误
- 需要仔细处理客户端特定的代码

### 4. 缓存策略

- 需要合理设计缓存策略
- 静态内容 vs 动态内容
- 用户特定内容的处理

## 适用场景

### 适合使用 SSR 的情况

1. **SEO 要求高**：需要搜索引擎优化的网站
2. **首屏性能重要**：用户体验要求高的应用
3. **社交媒体分享**：需要正确的预览信息
4. **内容为主**：新闻、博客、电商等以内容展示为主的应用

### 不适合使用 SSR 的情况

1. **高度交互的应用**：如游戏、实时协作工具
2. **用户特定的仪表板**：大量个性化内容
3. **简单的静态网站**：可以使用静态站点生成（SSG）

## 相关技术

- **静态站点生成（SSG）**：构建时生成 HTML
- **增量静态再生（ISR）**：按需重新生成静态页面
- **流式 SSR**：逐步发送 HTML 内容（Next.js 13+ 原生支持）
- **边缘渲染**：在 CDN 边缘节点进行渲染
- **Server Components**：Next.js 13+ 的服务器组件，默认在服务端渲染
- **React Server Components**：React 18+ 的原生服务端组件支持

## 总结

服务端渲染是一种在服务器端生成完整 HTML 页面的技术，主要优势是 SEO 友好和首屏加载速度快，但也会增加服务器负载和开发复杂度。选择 SSR 需要根据具体业务需求和技术团队能力来决定。


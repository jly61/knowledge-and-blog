# React服务端渲染示例

## 搭建基础框架

### 1. 初始化项目

在一个空文件夹中打开终端，执行以下命令初始化并安装必要的依赖：

```bash
npm init -y
npm install express react react-dom @babel/core @babel/register @babel/preset-env @babel/preset-react
```

### 2. 创建代码文件

我们需要创建三个文件：

#### 文件 A: `App.jsx` (React 组件)

这是我们想要在服务器端渲染的 UI 组件。

```jsx
// App.jsx
import React from 'react';

const App = () => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>Hello from SSR!</h1>
      <p>这段 HTML 是在服务器生成的，不是浏览器生成的。</p>
      <p>当前服务器时间: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default App;
```

#### 文件 B: `server.js` (Express 服务器逻辑)

这里是 SSR 的核心。我们要使用 `renderToString` 方法。

```javascript
// server.js
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  // 1. 核心步骤：将 React 组件渲染成普通的 HTML 字符串
  const appString = ReactDOMServer.renderToString(<App />);

  // 2. 将字符串拼接到完整的 HTML 模版中
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <title>Simple SSR Demo</title>
    </head>
    <body>
      <div id="root">${appString}</div>
    </body>
    </html>
  `;

  // 3. 发送给浏览器
  res.send(html);
});

app.listen(port, () => {
  console.log(`SSR 服务已启动: http://localhost:${port}`);
});
```

#### 文件 C: `index.js` (入口文件)

因为 Node.js 原生不认识 JSX 语法，我们需要这个入口文件来挂载 Babel，这样后面的 `import` 和 JSX 才能被 Node 识别。

```javascript
// index.js
require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react']
});

// 加载上面的服务器代码
require('./server');
```

-----

### 3. 运行 Demo

在终端执行：

```bash
node index.js
```

然后打开浏览器访问 `http://localhost:3000`。

### 4. 验证 SSR 是否成功

1.  在页面上右键点击 -\> **“查看网页源代码” (View Page Source)**。
2.  你会发现 `Hello from SSR!` 和具体的时间内容 **直接存在于源代码中**。
3.  **对比 CSR（客户端渲染）：** 如果是普通的 React 应用（如 Create React App），源代码里通常只有一个空的 `<div id="root"></div>`，内容是靠 JS 加载后填进去的。

### 总结：SSR 的核心原理

这个 Demo 展示了 SSR 最简单的形态：

1.  **脱水 (Dehydrate/Render):** 在服务器上调用 `renderToString`，把组件“拍扁”成 HTML 字符串。
2.  **传输:** 把纯 HTML 发送给浏览器（利于 SEO 和首屏速度）。

**注意：** 目前的 Demo 是**静态**的。如果你在 `App.jsx` 里加一个 `onClick` 点击事件，它在浏览器里是**不会工作**的。要让它动起来，需要进行\*\*“注水” (Hydration)\*\*，这需要配置 Webpack 将 JS 打包并在浏览器端重新执行一次 React。

-----


## 如何添加“注水 (Hydration)”步骤，让按钮点击事件生效？

  这非常关键。目前的 SSR 只是发送了一张“静态照片”（HTML），“注水（Hydration）”的过程就是把“灵魂”（JS事件监听）注入到这张照片里，让它动起来。

要实现这一点，我们需要克服一个障碍：**浏览器看不懂 React 的 JSX 语法，也不能直接运行我们写的模块化代码。**

因此，我们需要引入 **Webpack** 来把 React 代码打包成浏览器能运行的 JS 文件。

### 核心变化概览

1.  **Server 端**：照常生成 HTML，但在 HTML 里加一句 `<script src="/bundle.js"></script>`。
2.  **Client 端**：新增入口文件，使用 `hydrateRoot` 代替 `render`，去“认领”服务器生成的 HTML。
3.  **构建工具**：引入 Webpack，把 Client 端代码打包成 `bundle.js`。

-----

### 第一步：安装构建依赖

我们需要 Webpack 和对应的 Loader 来处理 JSX。

```bash
npm install webpack webpack-cli babel-loader --save-dev
```

### 第二步：修改 `App.jsx` (增加交互)

加一个简单的计数器，这样我们点按钮就能看出效果了。

```jsx
// App.jsx
import React, { useState } from 'react';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>SSR + Hydration Demo</h1>
      <p>服务器渲染 HTML，客户端接管交互。</p>
      <p>当前计数: <strong>{count}</strong></p>
      <button onClick={() => setCount(count + 1)}>点击 +1</button>
    </div>
  );
};

export default App;
```

### 第三步：创建客户端入口 `client.js`

这是浏览器下载并执行的第一段 JS。注意这里我们使用 `hydrateRoot` 而不是普通的 `createRoot`。

  * `createRoot`: 重新渲染整个页面，丢弃服务器的 HTML（闪烁）。
  * `hydrateRoot`: 复用服务器的 HTML，只挂载事件监听（平滑）。

<!-- end list -->

```javascript
// client.js
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 获取服务器已经渲染好的 root 节点
const container = document.getElementById('root');

// "注水"：给静态 HTML 加上事件监听
hydrateRoot(container, <App />);
```

### 第四步：配置 `webpack.config.js`

我们需要告诉 Webpack：请把 `client.js` 和它依赖的 `App.jsx` 打包成一个浏览器能读懂的 `bundle.js`。

在根目录新建 `webpack.config.js`:

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './client.js', // 入口是客户端脚本
  output: {
    path: path.resolve(__dirname, 'public'), // 打包输出到 public 目录
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /.jsx?$/, // 匹配 .js 和 .jsx 文件
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
```

### 第五步：修改服务器 `server.js`

我们需要做两件事：

1.  允许外部访问 `public` 文件夹（因为 `bundle.js` 在那里）。
2.  在 HTML 模板里插入 `<script>` 标签。

<!-- end list -->

```javascript
// server.js
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

const app = express();
const port = 3000;

// 1. 开启静态文件服务，让浏览器能请求到 /bundle.js
app.use(express.static('public'));

app.get('/', (req, res) => {
  const appString = ReactDOMServer.renderToString(<App />);

  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <title>SSR with Hydration</title>
    </head>
    <body>
      <div id="root">${appString}</div>
      <script src="/bundle.js"></script>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`SSR 服务已启动: http://localhost:${port}`);
});
```

-----

### 第六步：运行起来

现在我们需要两个步骤：先打包客户端代码，再启动服务器。

1.  **执行打包**（生成 `public/bundle.js`）：

    ```bash
    npx webpack
    ```

2.  **启动服务器**（依然通过 index.js 入口）：

    ```bash
    node index.js
    ```

3.  **测试**：

      * 打开 `http://localhost:3000`。
      * 你应该能看到页面。
      * **关键点**：点击“点击 +1”按钮，数字会变化！

### 这里发生了什么？

1.  **首屏加载 (SSR)**: 浏览器请求 `localhost:3000` -\> 服务器执行 `renderToString` -\> 浏览器收到带内容的 HTML（此时按钮还不能点，但你能看到字）。
2.  **加载 JS**: 浏览器解析 HTML，发现 `<script src="/bundle.js">`，于是去下载这个文件。
3.  **注水 (Hydration)**: `bundle.js` 下载并执行 -\> React 运行 `hydrateRoot` -\> React 发现 HTML 结构和 `App` 组件一致 -\> React **不重新创建 DOM**，而是把点击事件绑定到现有的 DOM 上。
4.  **交互**: 现在按钮可以响应点击了。

这就是现代前端框架（Next.js, Remix, Nuxt）底层的核心逻辑。

-----


## 如何在 SSR 中获取**异步数据**（例如从 API 获取数据并渲染）？
这是一个非常核心的问题。正如之前所说，`renderToString` 是同步的，它不会等你。

要解决这个问题，我们需要打破“组件自己获取数据”的思维定势，改为**服务器帮组件把数据拿好，然后喂给组件**。

这通常被称为 **"Fetch-Then-Render" (先获取，后渲染)** 模式。

以下是实现这一机制的三个标准步骤：

### 核心流程图

1.  **Server**: 收到请求 -\> 查找当前页面需要的组件。
2.  **Server**: 调用组件上的静态方法（如 `fetchData`）-\> **等待数据返回**。
3.  **Server**: 拿到数据 -\> 把数据作为 `props` 传给组件 -\> 生成 HTML。
4.  **Server**: **重要**！把这份数据序列化（JSON.stringify）放到 HTML 的 `<script>` 标签里（这叫“数据脱水”）。
5.  **Client**: 浏览器加载 -\> 从 `window` 对象上读取那份数据（这叫“数据注水”）。
6.  **Client**: 用这份数据初始化 React 组件 -\> 保证客户端渲染结果和服务器一致。

-----

### 代码实现

我们需要修改现有的三个文件来实现这个流程。

#### 第一步：修改 `App.jsx` (定义数据需求和接收 Props)

我们需要给 `App` 增加一个静态方法，告诉服务器：“渲染我之前，请先运行这个方法拿数据。”

同时，组件通过 `props` 接收数据，而不是在 `useEffect` 里自己去拿。

```jsx
// App.jsx
import React, { useState } from 'react';

const App = (props) => {
  // 优先使用传入的 props (服务端数据)，如果没有（比如纯客户端路由跳转），再用默认值
  const [data, setData] = useState(props.serverData || 'Loading...');

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px' }}>
      <h1>SSR Data Prefetching</h1>
      <p>数据来源: {props.serverData ? 'Server Side' : 'Client Side'}</p>
      <h3>文章内容: {data}</h3>
      <button onClick={() => alert('交互正常!')}>点我测试交互</button>
    </div>
  );
};

// 【关键点】：定义一个静态方法，供服务器调用
// 这个方法不依赖组件实例，必须返回一个 Promise
App.fetchData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('这是从模拟 API 获取到的重要内容 (延迟 500ms)');
    }, 500);
  });
};

export default App;
```

#### 第二步：修改 `server.js` (先拿数据，再渲染)

这是改动最大的地方。我们不能直接 render 了，要先 await 数据。

```javascript
// server.js
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

const app = express();
app.use(express.static('public'));

app.get('/', async (req, res) => {
  console.log('Server: 收到请求，开始获取数据...');
  
  // 1. 【Fetch】主动调用组件的静态方法获取数据
  // 在真实项目中，这里会根据路由匹配不同的组件
  const data = await App.fetchData();
  
  console.log('Server: 数据获取完毕:', data);

  // 2. 【Render】把获取到的数据作为 props 传进去渲染
  const appString = ReactDOMServer.renderToString(<App serverData={data} />);

  // 3. 【Dehydrate】数据脱水
  // 我们不仅要把 HTML 发给浏览器，还要把这份数据(data)发给浏览器
  // 否则浏览器端 React 只有 HTML 结构，没有数据，会导致 Hydration 失败
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>SSR Data Demo</title></head>
    <body>
      <div id="root">${appString}</div>
      
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(data)};
      </script>
      
      <script src="/bundle.js"></script>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(3000, () => console.log('Listening on 3000'));
```

#### 第三步：修改 `client.js` (数据注水)

浏览器端启动时，不能傻傻地用空数据初始化，必须去读服务器留下的“小纸条”（`window.__INITIAL_DATA__`）。

```javascript
// client.js
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 1. 从 window 对象中恢复数据
const initialData = window.__INITIAL_DATA__;

// 2. 这里的 props 必须和服务器端 renderToString 时传的一模一样
// 否则 React 会报错说 "UI 不匹配"
hydrateRoot(
  document.getElementById('root'),
  <App serverData={initialData} />
);

// (可选) 为了安全和清洁，用完后可以删除全局变量
delete window.__INITIAL_DATA__;
```

-----

### 验证效果

1.  重新打包客户端：`npx webpack`
2.  重启服务器：`node index.js`
3.  访问 `localhost:3000`。
4.  **观察：**
      * 页面加载出来时，直接就显示了“这是从模拟 API 获取到的重要内容...”。
      * **没有 Loading 状态**。
      * 查看网页源代码，你会发现数据既在 `<h3>` 标签里，也在底部的 `<script>` 标签里。

### 为什么必须要传 `window.__INITIAL_DATA__`？

如果你在 `server.js` 里传了数据渲染，但在 `client.js` 里没有传 `initialData`，会发生著名的 **Hydration Mismatch (注水不匹配)** 警告：

1.  **服务器 HTML**: `<h3>这是 API 内容</h3>`
2.  **浏览器 React 初始状态**: `useState` 默认是 `Loading...` -\> 虚拟 DOM 是 `<h3>Loading...</h3>`
3.  **结果**: React 发现 HTML 里是“API 内容”，但自己算是“Loading”，两者不一样！React 会大喊报错，并强制丢弃服务器的 HTML，重新渲染成“Loading”。**这会导致屏幕闪烁，SSR 白做了。**

### 生产环境是怎样的？

在真实的框架（如 Next.js 或使用 React Router 的 SSR）中，原理完全一样，只是封装得更好：

  * **Next.js**: 使用 `getServerSideProps` 或 `getStaticProps` 代替我们上面的 `App.fetchData`。
  * **React Router**: 使用 `loader` 函数来定义路由的数据需求。

这个 `Fetch-Then-Render` 流程是所有同构 SSR 应用的基石。


## 其他

### 为什么在这个架构下，`useEffect` 在服务端不执行，而在客户端会执行？

简单直接的答案是：**因为服务器端的渲染过程（`renderToString`）是“一次性”的，它没有“挂载（Mount）”和“更新（Update）”的概念，而 `useEffect` 被设计为在组件“挂载后”或“更新后”才执行的副作用。**

我们可以从**生命周期**和**执行机制**两个角度来深度拆解：

### 1. 机制差异：快照 vs. 活体

#### 在服务端 (`renderToString`)

  * **任务目标：** 仅仅是根据当前的 State 和 Props，计算出对应的 HTML 字符串。
  * **执行逻辑：** 它是一个**同步**过程。React 调用你的组件函数 `App()`，拿到返回值（JSX），将其递归转换成字符串，然后立即结束。
  * **为什么跳过 Effect？**
      * `useEffect` 的语义是“**副作用**”（Side Effect）。通常用于订阅事件、操作 DOM、发网络请求。
      * 在服务器上，没有 DOM 可以操作。
      * 服务器处理完 HTTP 请求就关闭了，无法维持“订阅”状态。
      * 如果服务器要等所有的 `useEffect` 执行完（可能包含异步请求），响应速度会变得极慢。
      * **结论：** 服务器只取“首帧画面”（Snapshot），不关心后续变化。

#### 在客户端 (`hydrateRoot`)

  * **任务目标：** 将组件挂载到 DOM 上，并启动 React 的完整生命周期。
  * **执行逻辑：**
    1.  **Render 阶段**：执行组件函数 `App()`（和服务器一样）。
    2.  **Commit 阶段**：React 将虚拟 DOM 映射到真实 DOM（在 Hydration 时是对比 checks）。
    3.  **Passive Effects 阶段**：DOM 准备好后，**浏览器绘制完成**，React 才会触发 `useEffect`。
  * **结论：** 客户端是一个完整的“活体”应用，拥有完整的生命周期。

-----

### 2. 代码执行对比图

为了让你看得更清楚，我们来看一段代码，看看它在两端分别打印了什么：

```jsx
import React, { useState, useEffect } from 'react';

const App = () => {
  // 1. 函数体：服务端和客户端都会执行
  console.log('Code: 1. Render Body (I run everywhere)');

  const [data, setData] = useState('Initial Data');

  useEffect(() => {
    // 2. Effect：只有客户端执行
    console.log('Code: 2. useEffect (I only run in browser)');
    
    // 这里通常做 API 请求
    // setData('Fetched Data');
  }, []);

  return <div>{data}</div>;
};
```

#### 执行流程表

| 阶段 | 发生地点 | 执行的代码 | 结果 |
| :--- | :--- | :--- | :--- |
| **阶段 1: 服务端渲染** | Node.js 服务器 | 执行 `App()` 函数体 | 控制台打印: `Code: 1...`<br>生成 HTML: `<div>Initial Data</div>` |
| **阶段 2: HTML 传输** | 网络 | (无 JS 执行) | 浏览器收到 HTML 字符串 |
| **阶段 3: 客户端注水** | 浏览器 | 执行 `App()` 函数体 | 控制台打印: `Code: 1...`<br>React 确认 HTML 结构一致 |
| **阶段 4: 挂载完成** | 浏览器 | **执行 `useEffect`** | 控制台打印: `Code: 2...`<br>触发可能的 `setData` 更新 |

### 3. 这个机制带来的两个重要推论

理解了这个原理，你就明白了 SSR 开发中的两个铁律：

#### 推论 A：千万不要在组件函数体内直接访问 `window` 或 `document`

因为函数体（Render Body）在服务端也会运行。Node.js 环境下没有 `window` 对象，代码会直接报错崩溃。

```javascript
const App = () => {
  // ❌ 错误：服务端运行到这行会报错：window is not defined
  const width = window.innerWidth; 

  useEffect(() => {
    // ✅ 正确：这里只有浏览器会运行，window 一定存在
    console.log(window.innerWidth);
  }, []);

  return <div>...</div>;
};
```

#### 推论 B：服务端渲染的数据必须是“同步”已知的

因为 `useEffect`（用于获取异步数据）在服务端不执行，如果你指望在 `useEffect` 里 `fetch` 数据来生成 HTML，**那是行不通的**。服务端生成的 HTML 里永远是 `Initial Data`（空数据或加载态）。

**这引出了 SSR 最麻烦的问题：** 既然 `useEffect` 不跑，服务器怎么在输出 HTML 之前就拿到数据（比如文章列表）填进去呢？

-----

#### 总结

  * **服务端 (`renderToString`)**: 为了速度，只跑主逻辑，生成静态 HTML，**无视** `useEffect`。
  * **客户端 (`hydrate`)**: 接管页面，跑完主逻辑后，**执行** `useEffect` 补充后续的交互和数据更新。


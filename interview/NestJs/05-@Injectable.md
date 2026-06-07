在 NestJS 中，`@Injectable()` 是实现 **依赖注入（Dependency Injection, DI）** 的核心装饰器。

简单来说，它的作用是告诉 NestJS 的 IoC（控制反转）容器：**“这个类是一个 Provider，请把它管起来，以便之后可以被注入到别的地方（比如 Controller 或其他 Service）。”**

---

### 1. 核心作用：声明 Provider

当你给一个类加上 `@Injectable()` 时，NestJS 会编译这个类并收集它的元数据（Metadata）。如果没有这个装饰器，NestJS 无法识别这个类是否可以作为依赖项被自动实例化。

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

---

### 2. 它是如何工作的？（依赖注入流程）

NestJS 采用的是 **构造函数注入**。当容器发现某个组件需要 `AppService` 时，它会：
1. 检查是否已经有了 `AppService` 的实例。
2. 如果没有，则实例化它。
3. 如果有，则直接复用（默认是单例模式）。



---

### 3. 为什么只有 Service 用它，Controller 不用？

你可能会发现 `AppController` 上面写的是 `@Controller()` 而不是 `@Injectable()`。
* **原因**：`@Controller()`、`@Module()` 等装饰器内部已经隐含了“可注入”的逻辑。
* **本质**：任何需要被 Nest 容器管理的类都必须有装饰器。对于普通的逻辑类（Service、Repository、Factory），统一使用 `@Injectable()`。

---

### 4. 关键点：单例与作用域

默认情况下，NestJS 中的所有 Provider 都是 **单例（Singleton）**。这意味着：
* 无论你在多少个地方注入 `AppService`，它们拿到的都是同一个实例。
* 这对性能非常友好，也方便共享状态。

如果你需要特殊的生命周期，可以配置 `scope`：
```typescript
@Injectable({ scope: Scope.REQUEST }) // 每个请求都会创建一个新实例
export class MyService {}
```

---

### 5. 常见错误：忘记注册

仅仅写了 `@Injectable()` 是不够的。你必须在对应的 **Module** 中将其加入 `providers` 数组，否则 NestJS 依然找不到它：

```typescript
@Module({
  controllers: [AppController],
  providers: [AppService], // 必须在这里声明
})
export class AppModule {}
```

---

### 总结

* **`@Injectable()`** 是“入场券”，让一个类有资格进入 Nest 的 DI 容器。
* 它配合 **构造函数** 使用，实现了代码的解耦。
* 对于你正在探索的后端架构，这种模式能让你在编写单元测试时轻松地 Mock 掉 Service，而不必担心复杂的对象创建逻辑。


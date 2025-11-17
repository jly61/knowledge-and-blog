FROM node:20-alpine AS base

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制 Prisma schema
COPY prisma ./prisma

# 生成 Prisma Client
RUN pnpm prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产环境镜像
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 pnpm（用于运行时）
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制必要文件
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]


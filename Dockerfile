FROM node:20-alpine AS base

# 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 环境变量（构建时需要）
ARG DASHSCOPE_API_KEY
ARG APP_ID
ARG OSS_ACCESS_KEY_ID
ARG OSS_ACCESS_KEY_SECRET
ARG JWT_SECRET

ENV DASHSCOPE_API_KEY=$DASHSCOPE_API_KEY
ENV APP_ID=$APP_ID
ENV OSS_ACCESS_KEY_ID=$OSS_ACCESS_KEY_ID
ENV OSS_ACCESS_KEY_SECRET=$OSS_ACCESS_KEY_SECRET
ENV JWT_SECRET=$JWT_SECRET

RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# 省心咨询 AI 智能咨询平台 - Code Wiki

## 1. 项目概述

### 1.1 项目简介

**省心咨询** 是一个基于 Next.js 构建的 AI 智能咨询平台，提供专业的多领域专家咨询服务，包括法律咨询、商业战略、财税规划等 10+ 位专家在线服务。

### 1.2 核心功能

| 功能模块 | 描述 |
|---------|------|
| 用户认证 | 注册、登录、JWT 认证 |
| 专家选择 | 10+ 位专业领域专家 |
| 流式聊天 | 实时响应、思考过程展示 |
| 会话管理 | 多会话存储与切换 |
| 文件上传 | 支持多种文件格式 |
| 深度思考 | AI 思考过程可视化 |
| 联网搜索 | 可选联网获取最新信息 |

### 1.3 技术栈

| 分类 | 技术 | 版本 |
|-----|------|-----|
| 框架 | Next.js | 16.2.6 |
| 语言 | TypeScript | ^5 |
| UI | React | 19.2.4 |
| 样式 | Tailwind CSS | ^4 |
| 组件库 | Radix UI | ^1 |
| 图标 | Lucide React | ^1.16 |
| 数据库 | 阿里云 TableStore | ^5.4 |
| 对象存储 | 阿里云 OSS | ^6.18 |
| 大模型 | 阿里云 DashScope | - |

---

## 2. 项目架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端层 (Frontend)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages: /login /chat /                                         │
│  Components: ExpertSelector, ChatBubble, ChatInput, ...        │
│  Hooks: useChat, useSession                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      业务层 (Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│  API Routes: /api/chat /api/user /api/logout                   │
│  Server Actions: loginAction, registerAction                    │
│  Middleware: 认证拦截、路由保护                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      数据层 (Data)                              │
├─────────────────────────────────────────────────────────────────┤
│  Database: 阿里云 TableStore (用户数据)                         │
│  Storage: 阿里云 OSS (文件存储)                                 │
│  LLM: 阿里云 DashScope (大模型服务)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
opc-next/
├── app/                      # Next.js App Router
│   ├── actions/              # Server Actions
│   │   └── auth.ts           # 认证相关 Actions
│   ├── api/                  # API Routes
│   │   ├── chat/route.ts     # 聊天 API
│   │   ├── user/route.ts     # 用户信息 API
│   │   └── logout/route.ts   # 登出 API
│   ├── chat/                 # 聊天页面
│   │   └── page.tsx          # ChatPage 组件
│   ├── login/                # 登录页面
│   │   └── page.tsx          # LoginPage 组件
│   ├── layout.tsx            # 根布局
│   ├── middleware.ts         # 中间件（认证拦截）
│   └── globals.css           # 全局样式
├── components/               # UI 组件
│   ├── ui/                   # Radix UI 封装组件
│   │   ├── avatar.tsx        # 头像组件
│   │   ├── button.tsx        # 按钮组件
│   │   ├── dialog.tsx        # 对话框组件
│   │   ├── dropdown-menu.tsx # 下拉菜单组件
│   │   └── ...               # 其他 UI 组件
│   ├── chat-bubble.tsx       # 聊天气泡组件
│   ├── chat-input.tsx        # 聊天输入组件
│   ├── expert-selector.tsx   # 专家选择器组件
│   ├── markdown-renderer.tsx # Markdown 渲染组件
│   └── ...                   # 其他业务组件
├── lib/                      # 工具库
│   ├── auth.ts               # 认证工具（JWT、密码哈希）
│   ├── db.ts                 # 数据库操作（TableStore）
│   ├── api.ts                # 前端 API 调用封装
│   ├── oss.ts                # OSS 文件上传
│   ├── expert-prompts.ts     # 专家提示词配置
│   ├── hooks/                # 自定义 Hooks
│   │   ├── use-chat.ts       # 聊天状态管理
│   │   └── use-session.ts    # 会话状态管理
│   ├── env.ts                # 环境变量验证
│   └── utils.ts              # 通用工具函数
├── types/                    # TypeScript 类型定义
│   └── index.ts              # 核心类型定义
├── public/                   # 静态资源
├── next.config.ts            # Next.js 配置
├── package.json              # 依赖配置
└── tsconfig.json             # TypeScript 配置
```

---

## 3. 核心模块详解

### 3.1 认证模块

#### 3.1.1 认证工具 (`lib/auth.ts`)

| 函数名 | 功能描述 | 参数 | 返回值 |
|-------|---------|------|-------|
| `generateToken` | 生成 JWT Token | `userId: string` | `string` (JWT) |
| `verifyToken` | 验证 JWT Token | `token: string` | `object \| null` |
| `hashPassword` | 密码哈希（SHA256） | `password: string` | `string` |
| `sanitizeInput` | 输入清理（防XSS） | `text: string` | `string` |

**Token 结构**：
```typescript
{
  alg: 'HS256',      // 算法
  userId: string,     // 用户ID
  iat: number,       // 签发时间
  exp: number        // 过期时间（24小时）
}
```

#### 3.1.2 Server Actions (`app/actions/auth.ts`)

| 函数名 | 功能描述 |
|-------|---------|
| `loginAction` | 登录验证，生成并设置 Cookie |
| `registerAction` | 用户注册，保存到 TableStore |
| `logoutAction` | 清除 Cookie |
| `getCurrentUser` | 获取当前登录用户信息 |

#### 3.1.3 中间件 (`app/middleware.ts`)

**路由保护规则**：

| 路由 | 保护状态 | 说明 |
|-----|---------|------|
| `/chat` | 受保护 | 需登录才能访问 |
| `/login` | 公开 | 已登录用户自动跳转 |
| `/` | 公开 | 首页 |
| `/api/*` | 受保护 | 需 Token |

---

### 3.2 数据库模块 (`lib/db.ts`)

基于阿里云 TableStore 实现，包含用户缓存机制。

| 函数名 | 功能描述 | 参数 |
|-------|---------|------|
| `getUser` | 获取用户信息（带缓存） | `username: string` |
| `saveUser` | 保存用户信息 | `username: string, passwordHash: string` |
| `userExists` | 检查用户是否存在 | `username: string` |

**缓存策略**：
- 使用 `Map` 缓存用户数据
- 缓存有效期：60 秒
- 写入时同时更新缓存

---

### 3.3 API 模块

#### 3.3.1 聊天 API (`app/api/chat/route.ts`)

**功能**：流式调用阿里云 DashScope 大模型服务

**请求参数**：
```typescript
{
  text: string,           // 用户输入
  expert: string,         // 专家名称
  history: Message[],     // 历史消息
  enable_search: boolean, // 是否启用联网搜索
  enable_thinking: boolean, // 是否启用思考过程
  files: Array<{name, contentType, data}> // 上传文件
}
```

**响应格式**（SSE 流式）：
```typescript
{
  type: 'thinking' | 'content' | 'done',
  data: string
}
```

**核心流程**：
1. Token 验证
2. 文件上传到 OSS（如有）
3. 构建专家提示词参数
4. 调用 DashScope API（SSE 流式）
5. 返回流式响应

#### 3.3.2 用户 API (`app/api/user/route.ts`)

**GET**：获取当前用户信息（需认证）

---

### 3.4 专家系统

#### 3.4.1 专家配置 (`types/index.ts`)

**专家列表**（共 10 位）：

| 专家名称 | 角色 | 领域 |
|---------|------|------|
| 法智助手 | 专业AI法律咨询顾问 | 民事、刑事、劳动法 |
| 知行者·战略架构师 | 顶级商业战略顾问 | 顶层设计、战略规划 |
| 问道·商业谋略官 | 资深商业顾问 | 商业模式、订单转化 |
| 商事合规顾问 | 专业AI法律顾问 | 商事风控、合同审核 |
| 劳动用工法务 | 专业AI劳动法律顾问 | 用工合规、劳动纠纷 |
| 企业财税规划师 | 专业AI财税顾问 | 金税四期、税务筹划 |
| 资本融资顾问 | 专业AI融资顾问 | 融资方案、BP打磨 |
| 政企政策研究员 | 专业AI政策顾问 | OPC申报、政策解读 |
| AI智能体研发顾问 | 专业AI技术顾问 | AI智能体、数字化转型 |
| OPC创业训战导师 | 专业创业导师 | OPC孵化、一人企业 |

#### 3.4.2 提示词配置 (`lib/expert-prompts.ts`)

每个专家包含以下配置项：

| 配置项 | 说明 |
|-------|------|
| `role` | 专家角色定义 |
| `expertise` | 专业领域描述 |
| `tone` | 回复风格 |
| `core_rules` | 核心规则（如免责声明） |
| `workflow` | 思考流程 |
| `output_format` | 输出格式模板 |
| `disclaimer` | 免责声明内容 |

---

### 3.5 聊天组件

#### 3.5.1 ChatPage (`app/chat/page.tsx`)

**核心状态**：
```typescript
const [messages, setMessages] = useState<Message[]>([])     // 消息列表
const [selectedExpert, setSelectedExpert] = useState<string | null>(null)  // 选中的专家
const [isLoading, setIsLoading] = useState(false)           // 加载状态
const [sessions, setSessions] = useState<ChatSession[]>([]) // 会话列表
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null) // 当前会话ID
```

**核心方法**：

| 方法名 | 功能 |
|-------|------|
| `handleSend` | 发送消息，调用流式 API |
| `handleSelectExpert` | 选择专家 |
| `handleSelectSession` | 切换会话 |
| `saveSession` | 保存会话到 localStorage |
| `createNewSession` | 创建新会话 |

#### 3.5.2 ChatBubble (`components/chat-bubble.tsx`)

**功能**：渲染单条消息气泡

**特性**：
- 支持 Markdown 渲染
- 思考过程可折叠展示
- 流式输出动画
- 一键复制功能

#### 3.5.3 ChatInput (`components/chat-input.tsx`)

**功能**：聊天输入框组件

**特性**：
- 自动高度调整（1-6 行）
- 文件上传（支持 docx、pdf、图片等）
- 语音输入（Web Speech API）
- 深度思考开关
- 联网搜索开关

---

## 4. 数据结构定义

### 4.1 核心类型 (`types/index.ts`)

#### Message 接口
```typescript
interface Message {
  id: string              // 消息唯一ID
  role: 'user' | 'assistant' | 'system'  // 角色
  content: string         // 消息内容
  timestamp: number       // 时间戳
  thinking?: string       // 思考过程（仅 AI 消息）
}
```

#### ChatSession 接口
```typescript
interface ChatSession {
  id: string              // 会话ID
  title: string           // 会话标题
  messages: Message[]     // 消息列表
  expert: string          // 专家名称
  createdAt: number       // 创建时间
  updatedAt: number       // 更新时间
}
```

#### ExpertConfig 接口
```typescript
interface ExpertConfig {
  name: string            // 专家名称
  role: string            // 角色描述
  icon: string            // 图标（emoji）
  description: string     // 专家简介
  color: string           // 主题颜色（Tailwind类名）
  questions: string[]     // 预设问题
}
```

---

## 5. 依赖关系

### 5.1 核心依赖

```json
{
  "next": "16.2.6",           // Next.js 框架
  "react": "19.2.4",          // React 核心
  "react-dom": "19.2.4",      // React DOM
  "typescript": "^5",          // TypeScript
  "tailwindcss": "^4",         // Tailwind CSS 4
  "@tailwindcss/postcss": "^4",// Tailwind PostCSS 插件
  
  // UI 组件库
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-scroll-area": "^1.2.10",
  "@radix-ui/react-switch": "^1.2.6",
  "@radix-ui/react-tooltip": "^1.2.8",
  
  // 工具库
  "lucide-react": "^1.16.0",          // 图标库
  "clsx": "^2.1.1",                   // 类名合并
  "tailwind-merge": "^3.6.0",         // Tailwind 类名合并
  "react-textarea-autosize": "^8.5.9", // 自动调整高度的文本框
  
  // 后端服务
  "tablestore": "^5.4.0",             // 阿里云 TableStore
  "ali-oss": "^6.18.0",               // 阿里云 OSS
  
  // Markdown 渲染
  "react-markdown": "^10.1.0",         // Markdown 渲染
  "remark-gfm": "^4.0.1",              // GFM 支持
  "rehype-highlight": "^7.0.2",        // 代码高亮
  "rehype-raw": "^7.0.0",              // 原始 HTML 支持
  "rehype-sanitize": "^6.0.0",         // HTML 安全过滤
  
  // 状态管理
  "sonner": "^2.0.7"                   // Toast 消息组件
}
```

### 5.2 依赖关系图

```
┌────────────────────────────────────────────────────────────┐
│                      应用层 (App)                          │
├────────────────────────────────────────────────────────────┤
│  pages/           components/          lib/               │
│    │                  │                │                  │
│    ▼                  ▼                ▼                  │
├────────────────────────────────────────────────────────────┤
│                      框架层 (Framework)                    │
├────────────────────────────────────────────────────────────┤
│  Next.js ──► React ──► Tailwind CSS                      │
│       │              │              │                      │
│       ▼              ▼              ▼                      │
│  Server Actions   Hooks         Radix UI                  │
├────────────────────────────────────────────────────────────┤
│                      服务层 (Services)                     │
├────────────────────────────────────────────────────────────┤
│  TableStore ── OSS ── DashScope                           │
│    │            │         │                               │
│    ▼            ▼         ▼                               │
│  用户数据    文件存储    大模型服务                        │
└────────────────────────────────────────────────────────────┘
```

---

## 6. 配置与运行

### 6.1 环境变量

项目需要以下环境变量（`.env.local`）：

```env
# JWT 密钥
JWT_SECRET=your-secret-key-change-in-production

# 阿里云 TableStore 配置
TABLESTORE_ACCESS_KEY_ID=your-access-key-id
TABLESTORE_ACCESS_KEY_SECRET=your-access-key-secret
TABLESTORE_ENDPOINT=https://your-instance.cn-hangzhou.tablestore.aliyuncs.com
TABLESTORE_INSTANCE_NAME=your-instance-name

# 阿里云 OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name

# 阿里云 DashScope 配置
DASHSCOPE_API_KEY=your-dashscope-api-key
APP_ID=your-app-id
```

### 6.2 启动命令

| 命令 | 描述 |
|-----|------|
| `npm run dev` | 开发模式启动（端口 3000） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 代码检查 |
| `npm run deploy:fc` | 部署到阿里云 FC（函数计算） |

### 6.3 部署方式

**Docker 部署**：
```bash
# 构建镜像
docker build -t opc-next .

# 运行容器
docker run -p 3000:3000 --env-file .env.local opc-next
```

**阿里云 FC 部署**：
```bash
npm run deploy:fc
```

---

## 7. 安全注意事项

### 7.1 认证安全
- JWT Token 使用 HttpOnly Cookie 存储
- 密码使用 SHA256 哈希存储（加盐）
- Token 有效期 24 小时

### 7.2 输入安全
- 用户输入使用 `sanitizeInput` 防 XSS
- 文件上传限制大小（10MB）
- 文件类型白名单过滤

### 7.3 数据安全
- API 请求均需 Token 验证
- 敏感配置通过环境变量管理
- OSS 存储使用 HTTPS

---

## 8. 开发规范

### 8.1 代码风格
- 使用 TypeScript 严格模式
- 函数命名使用 camelCase
- 文件命名使用 kebab-case
- 组件命名使用 PascalCase

### 8.2 目录组织
- `app/`: 页面和 API 路由
- `components/`: UI 组件
- `lib/`: 工具函数和业务逻辑
- `types/`: 类型定义

### 8.3 最佳实践
- 使用 Server Actions 处理敏感操作
- 使用 Next.js App Router
- 组件优先使用 Client 组件模式
- 状态管理使用 React Hooks

---

## 附录：会话存储机制

### localStorage 存储结构

```typescript
// 选中的专家
localStorage.setItem('selected-expert', '法智助手')

// 会话列表（JSON 字符串）
localStorage.setItem('chat-sessions', JSON.stringify([
  {
    id: '1234567890',
    title: '劳动合同纠纷咨询',
    messages: [...],
    expert: '法智助手',
    createdAt: 1234567890000,
    updatedAt: 1234567890000
  }
]))
```

### 会话恢复流程

1. 页面加载时读取 localStorage
2. 恢复选中的专家配置
3. 加载该专家的最新会话
4. 渲染历史消息

---

**文档版本**: v1.0  
**生成时间**: 2026-05-29  
**项目版本**: 0.1.0
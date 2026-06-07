# 阿里云 FC 部署指南

## 📦 部署方式

### 方式一：Docker 镜像部署（推荐）

#### 1. 构建镜像
```bash
docker build \
  --build-arg DASHSCOPE_API_KEY=你的密钥 \
  --build-arg APP_ID=你的应用ID \
  --build-arg OSS_ACCESS_KEY_ID=你的密钥 \
  --build-arg OSS_ACCESS_KEY_SECRET=你的密钥 \
  --build-arg JWT_SECRET=你的密钥 \
  -t opc-next:latest .
```

#### 2. 推送到阿里云容器镜像服务
```bash
docker tag opc-next:latest registry.cn-hangzhou.aliyuncs.com/你的命名空间/opc-next:latest
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/opc-next:latest
```

#### 3. FC 控制台配置
- 函数类型：容器镜像
- 镜像地址：registry.cn-hangzhou.aliyuncs.com/你的命名空间/opc-next:latest
- 内存：512 MB
- 超时时间：60 秒
- 实例并发：10
- 环境变量：在控制台添加所有 .env.local 中的变量

---

### 方式二：Serverless Devs 部署

#### 1. 安装工具
```bash
npm install -g @serverless-devs/s
```

#### 2. 配置密钥
```bash
s config add
# 选择阿里云，输入 AccessKey ID 和 Secret
```

#### 3. 创建 s.yaml
在项目根目录创建 `s.yaml`（见下方模板）

#### 4. 部署
```bash
s deploy -y
```

---

## 🔧 环境变量配置

在 FC 控制台添加以下环境变量：

```
DASHSCOPE_API_KEY=sk-xxx
APP_ID=xxx
OSS_ACCESS_KEY_ID=LTAIxxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=follow-ai
JWT_SECRET=your-secret-key-change-in-production
TABLESTORE_ENDPOINT=https://follow-ai.cn-hangzhou.tablestore.aliyuncs.com
TABLESTORE_INSTANCE_NAME=follow-ai
```

---

## ⚙️ FC 配置建议

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| 内存 | 512 MB | 流式响应需要足够内存 |
| 超时 | 60 秒 | AI 响应可能较长 |
| 实例并发 | 10 | 平衡成本和性能 |
| 最小实例 | 0 | 按量付费，节省成本 |
| 最大实例 | 50 | 应对突发流量 |

---

## 🌐 自定义域名

1. FC 控制台 → 函数详情 → 触发器 → 创建 HTTP 触发器
2. 绑定自定义域名
3. 配置 CDN（可选）

---

## 📊 监控日志

- 日志服务：FC 自动写入 SLS
- 查看路径：阿里云日志服务 → logstores
- 错误追踪：函数日志 → 搜索 ERROR

---

## 🚀 更新部署

```bash
# Docker 方式
docker build -t opc-next:latest .
docker tag opc-next:latest registry.xxx/xxx/opc-next:v2
docker push registry.xxx/xxx/opc-next:v2
# FC 控制台更新镜像版本

# Serverless Devs 方式
s deploy -y
```

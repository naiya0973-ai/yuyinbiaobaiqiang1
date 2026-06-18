# 完整功能部署指南

要实现登录、发布语音、点赞评论等完整功能，需要部署 **前端 + 后端 + 数据库** 三部分。

## 架构

| 组件 | 平台 | 地址 |
|------|------|------|
| 前端 H5 | GitHub Pages | https://naiya0973-ai.github.io/yuyinbiaobaiqiang1/ |
| 后端 API | Render（免费） | https://voice-confession-wall-api.onrender.com |
| 数据库 | Supabase（免费） | PostgreSQL |

---

## 第一步：配置 Supabase 数据库

1. 访问 [Supabase](https://supabase.com/) 注册并创建项目
2. 打开 **SQL Editor**，执行 `server/database/supabase_schema.sql` 中的全部 SQL
3. 在 **Project Settings → API** 复制以下信息：
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（仅后端使用，勿泄露）

---

## 第二步：部署后端到 Render

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. **New +** → **Blueprint**，连接仓库 `naiya0973-ai/yuyinbiaobaiqiang1`
3. 或手动创建 **Web Service**：
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

4. 配置环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `10000` | Render 端口 |
| `JWT_SECRET` | 随机长字符串 | 至少 32 位 |
| `SUPABASE_URL` | 你的 Supabase URL | 必填 |
| `SUPABASE_ANON_KEY` | anon key | 必填 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | 必填 |
| `BASE_URL` | `https://voice-confession-wall-api.onrender.com` | 音频文件访问地址 |
| `CLIENT_ORIGIN` | `https://naiya0973-ai.github.io` | CORS 允许的前端 |
| `ADMIN_ORIGIN` | `https://naiya0973-ai.github.io` | 管理后台来源 |
| `DEMO_SMS_CODE` | `123456` | 演示验证码（上线前可换真实短信） |

5. 部署完成后访问 `https://你的服务名.onrender.com/health`，应返回 `{"status":"ok"}`

---

## 第三步：配置前端 API 地址

### 方式 A：GitHub Actions 变量（推荐）

1. 打开仓库 **Settings → Secrets and variables → Actions → Variables**
2. 新建变量：
   - 名称：`VUE_APP_API_URL`
   - 值：`https://voice-confession-wall-api.onrender.com/api`（替换为你的 Render 地址）

3. 重新触发部署：推送代码，或在 Actions 页面手动 **Run workflow**

### 方式 B：本地构建

编辑 `client/.env.production`：

```
VUE_APP_API_URL=https://voice-confession-wall-api.onrender.com/api
```

---

## 第四步：启用 GitHub Pages

1. 仓库 **Settings → Pages**
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选择 `gh-pages` / `(root)`
4. 保存

---

## 第五步：验证完整功能

| 功能 | 测试方法 |
|------|----------|
| 登录 | 手机号任意合法号码，验证码 `123456`（演示模式） |
| 浏览广场 | 首页加载语音列表 |
| 发布文字 | 选择分类 + 输入文字 → 发布 |
| 发布语音 | 发布页按住麦克风录制（H5 需授权麦克风） |
| 点赞/评论 | 进入详情页操作 |

---

## 演示登录说明

当前未接入真实短信服务。生产环境使用 `DEMO_SMS_CODE=123456` 作为演示验证码：

1. 输入手机号 → 点击「获取验证码」
2. 输入验证码 `123456` → 登录

接入真实短信后，删除 `DEMO_SMS_CODE` 环境变量，并实现 `server/routes/auth.js` 中的短信发送逻辑。

---

## 常见问题

### API 请求失败 / 网络错误
- 检查 `VUE_APP_API_URL` 是否指向正确的 Render 地址（需带 `/api` 后缀）
- 检查 Render 服务是否已唤醒（免费版休眠后首次访问需等待约 30 秒）

### CORS 错误
- 确认 `CLIENT_ORIGIN` 为 `https://naiya0973-ai.github.io`（不含路径）

### 登录提示验证码错误
- 确认已点击「获取验证码」后再登录
- 演示环境使用 `123456`
- 检查 Supabase 中 `sms_codes` 表是否已创建

### 录音无法使用
- H5 需在 HTTPS 环境下使用（GitHub Pages 满足）
- 浏览器需授权麦克风权限

### 音频播放失败
- 确认 `BASE_URL` 环境变量已设置为 Render 服务地址
- Render 免费版重启后本地上传的音频会丢失，长期运行建议迁移到 Supabase Storage

---

## 保持 Render 不休眠（可选）

使用 [UptimeRobot](https://uptimerobot.com/) 每 5 分钟访问一次 `/health` 接口。

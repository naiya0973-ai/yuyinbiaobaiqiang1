# 部署指南

## 架构

- **前端**: uni-app H5 → GitHub Pages
- **后端**: Express.js → Render (免费)
- **数据库**: Supabase (免费PostgreSQL)
- **文件存储**: 腾讯云 COS / Supabase Storage

---

## 1. 后端部署 (Render)

### 步骤:

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **New +** → **Web Service**
3. 连接 GitHub 仓库 `naiya0973-ai/yuyinbiaobaiqiang1`
4. 配置:
   - **Name**: `voice-confession-wall-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. 添加环境变量:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=<生成随机字符串>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
CLIENT_ORIGIN=https://naiya0973-ai.github.io
ADMIN_ORIGIN=https://naiya0973-ai.github.io
```

6. 点击 **Create Web Service**

部署完成后，记录下你的 API 地址，如:
```
https://voice-confession-wall-api.onrender.com
```

---

## 2. 数据库配置 (Supabase)

1. 访问 [Supabase](https://supabase.com/) 创建项目
2. 执行 `server/database/supabase_schema.sql` 中的SQL语句创建表
3. 在 Project Settings → API 中获取 `URL` 和 `anon public` key

---

## 3. 前端部署 (GitHub Pages)

### 自动部署 (GitHub Actions)

项目已配置 GitHub Actions，推送代码后会自动构建并部署。

### 手动部署:

```bash
# 进入客户端目录
cd client

# 安装依赖
npm install

# 构建H5版本
npm run build:h5

# 将 dist/build/h5 目录内容推送到 gh-pages 分支
```

### 配置 API 地址:

修改 `client/.env.production`:
```
VUE_APP_API_URL=https://voice-confession-wall-api.onrender.com
```

---

## 4. 启用 GitHub Pages

1. 进入仓库 Settings → Pages
2. **Source**: Deploy from a branch
3. **Branch**: `gh-pages` / `(root)`
4. 点击 Save

---

## 5. 访问应用

- **前端**: https://naiya0973-ai.github.io/yuyinbiaobaiqiang1
- **后端API**: https://voice-confession-wall-api.onrender.com

---

## 常见问题

### Render 免费版休眠问题
免费版15分钟无请求会休眠，首次访问可能需要30秒唤醒。

解决方案:
- 使用 [UptimeRobot](https://uptimerobot.com/) 每5分钟ping一次保持活跃
- 或升级到付费计划

### CORS 错误
确保 `CLIENT_ORIGIN` 环境变量设置为你的 GitHub Pages URL。

### 文件上传
生产环境需要配置腾讯云COS或Supabase Storage，修改 `server/routes/upload.js` 中的存储配置。

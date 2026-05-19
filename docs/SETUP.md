# 环境搭建

## 前置要求

- Node.js 18+
- npm 9+
- Supabase 项目（已执行 `server/database/supabase_schema.sql`）

## 1. 后端

```bash
cd server
npm install
copy .env.example .env
```

编辑 `server/.env`，至少配置：

- `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ADMIN_TOKEN`（管理后台登录密钥，自行生成随机字符串）
- `CLIENT_ORIGIN`（前端 H5 地址，如 `http://localhost:3001`）
- `ADMIN_ORIGIN`（管理后台地址，如 `http://localhost:5174`）

启动：

```bash
npm run dev
```

默认 API：`http://localhost:3000`

## 2. 用户端（uni-app）

```bash
cd client
npm install
npm run dev:h5
```

修改 `client/utils/request.js` 中的 `BASE_URL` 指向你的 API 地址。

## 3. 管理后台

```bash
cd admin
npm install
npm run dev
```

浏览器打开控制台提示的地址（默认 `http://localhost:5174`），使用 `.env` 中配置的 `ADMIN_TOKEN` 登录。

## 4. 开发期验证码

非生产环境下，登录验证码默认为 `123456`（见 `server/.env` 中 `MOCK_SMS_CODE`）。

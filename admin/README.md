# Taking 管理后台

用于处理待审核语音、举报记录的后台页面。

## 启动

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5174`（通过 Vite 代理访问 `http://localhost:3000/api`）

## 登录

在 `server/.env` 中设置 `ADMIN_TOKEN`，启动管理后台后输入该密钥登录。

## 功能

- 数据概览：用户、语音、待审、待处理举报数量
- 待审内容：通过 / 隐藏 / 删除
- 举报处理：标记已处理或驳回

详细 API 见 [docs/API.md](../docs/API.md)。

# 安全漏洞修复报告

## 修复概览

本次安全审查发现并修复了以下安全漏洞：

---

## 1. 硬编码验证码漏洞 (Critical)

**位置**: `server/routes/auth.js`

**问题**: `MOCK_SMS_CODE` 默认值为 `'123456'`，在生产环境会导致严重的安全隐患，攻击者可以使用固定验证码登录任意账户。

**修复**:
- 仅在开发环境允许使用固定验证码
- 添加环境检查：`const isDevelopment = process.env.NODE_ENV !== 'production'`
- 生产环境必须验证真实短信验证码

---

## 2. 手机号信息泄露 (High)

**位置**: `server/routes/auth.js`, `server/controllers/meController.js`

**问题**: API 响应中返回完整的用户手机号，这是敏感信息泄露。

**修复**:
- 添加 `maskPhone()` 函数对手机号进行脱敏处理
- 格式：`138****1234`

---

## 3. 文件上传内存泄漏 (Medium)

**位置**: `server/routes/upload.js`

**问题**: 使用内存中的 `Map` 跟踪文件所有权，这会导致：
- 多进程部署时无法共享状态
- 内存无限增长（没有过期清理机制）
- 服务重启后数据丢失

**修复**:
- 使用 Supabase 数据库表 `uploaded_files` 存储上传记录
- 将 `trackUpload` 和 `ownsUpload` 改为异步函数
- 在删除文件时同步删除数据库记录

**新增数据库表**:
```sql
create table if not exists public.uploaded_files (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  created_at timestamptz not null default now()
);
```

---

## 4. 文件上传类型验证绕过 (High)

**位置**: `server/routes/upload.js`

**问题**:
- `fileFilter` 允许 MIME 类型或扩展名，但 MIME 类型可被伪造
- 攻击者可能上传恶意文件（如伪装成 MP3 的可执行文件）

**修复**:
- 添加严格的 MIME 类型和扩展名双重验证
- 添加文件魔数（Magic Numbers）验证，检查文件真实类型
- 支持的文件类型签名：MP3、WAV、AAC、OGG、WebM、M4A

---

## 5. 关键端点缺少速率限制 (Medium)

**位置**: `server/app.js`, `server/routes/confession.js`, `server/routes/comment.js`

**问题**:
- 表白创建端点没有速率限制，可能导致垃圾内容泛滥
- 评论创建端点没有速率限制
- 点赞端点没有速率限制

**修复**:
- 添加 `createConfessionLimiter`: 每小时最多20个表白
- 添加 `createCommentLimiter`: 每小时最多50条评论
- 添加 `likeLimiter`: 每分钟最多30次点赞
- 使用用户ID而非IP作为限流键，避免影响正常用户

---

## 6. Avatar URL XSS 漏洞 (High)

**位置**: `server/routes/auth.js`, `server/routes/user.js`

**问题**: `avatarUrl` 验证仅使用 `isURL()`，没有限制协议，可能允许 `javascript:` 或 `data:` 协议的 URL，导致 XSS 攻击。

**修复**:
- 限制 URL 协议只能是 `http` 或 `https`
- 添加额外的协议检查，拒绝 `javascript:`, `data:`, `vbscript:` 等危险协议

---

## 前端安全修复

### 7. 内容安全策略 (CSP) 缺失 (High)

**位置**: `client/index.html`

**问题**: 静态预览页面没有 CSP 头，容易受到 XSS 攻击。

**修复**:
- 添加 CSP meta 标签，限制资源加载来源
- 添加 `X-Frame-Options: DENY` 防止点击劫持
- 添加 `X-XSS-Protection` 和 `X-Content-Type-Options` 头
- 添加 `Referrer-Policy` 控制引用信息

---

### 8. API 请求安全配置 (Medium)

**位置**: `client/utils/request.js`

**问题**:
- 硬编码 API 基础 URL
- 没有请求超时设置
- 没有域名白名单验证
- 错误信息可能泄露敏感信息

**修复**:
- 使用环境变量配置 API URL
- 添加 30 秒请求超时
- 添加域名白名单验证
- 统一的错误处理和认证错误处理
- 添加请求头 `X-Requested-With: XMLHttpRequest`

---

### 9. 登录暴力破解风险 (Medium)

**位置**: `client/pages/login/login.vue`

**问题**: 登录功能没有限制尝试次数，可能被暴力破解。

**修复**:
- 添加登录尝试次数限制（5次）
- 达到限制后锁定 5 分钟
- 增强昵称输入验证，防止 XSS
- 清理用户输入中的危险字符

---

### 10. 用户数据 XSS 漏洞 (High)

**位置**: `client/store/index.js`, `client/pages/profile/profile.vue`

**问题**:
- 用户数据存储和显示没有进行适当的清理
- 可能显示包含恶意脚本的用户昵称

**修复**:
- 在 store 中添加数据清理函数
- 验证 JWT Token 格式
- 清理用户昵称、头像 URL 等字段
- 限制字符串长度
- 拒绝危险协议的 URL

---

### 11. 发布内容 XSS 漏洞 (High)

**位置**: `client/pages/post/post.vue`

**问题**: 用户发布的文字内容可能包含 XSS 攻击代码。

**修复**:
- 添加内容清理函数
- 在发布前验证和清理内容
- 限制内容长度

---

### 12. Preview.html 安全漏洞 (Critical/High)

**位置**: `client/preview.html`

**问题**:
1. **硬编码验证码**: 验证码固定为 `123456`，存在安全风险
2. **XSS 漏洞**: 用户输入直接插入 HTML，没有转义
3. **缺少 CSP**: 没有内容安全策略头
4. **登录暴力破解**: 没有登录尝试次数限制
5. **手机号泄露**: 显示完整手机号

**修复**:
- 移除硬编码验证码，改为动态生成随机6位数字
- 添加 `escapeHtml()` 函数对所有用户输出进行 HTML 转义
- 添加 `sanitizeInput()` 函数清理用户输入
- 添加 CSP、X-Frame-Options、X-XSS-Protection 等安全头
- 添加登录尝试次数限制（5次），超过后锁定5分钟
- 添加手机号验证和脱敏显示
- 添加输入长度限制（昵称20字符，内容500字符）

---

## 额外的安全建议

1. **定期清理过期文件**: 建议添加定时任务清理数据库中不存在对应文件的记录，以及上传目录中未被引用的文件

2. **生产环境配置检查**: 建议在应用启动时检查关键环境变量是否已正确配置

3. **日志脱敏**: 确保日志中不包含敏感信息（如完整手机号、Token等）

4. **内容安全策略 (CSP)**: 考虑在 Helmet 配置中添加 CSP 头

5. **文件病毒扫描**: 对于生产环境，建议集成病毒扫描服务（如 ClamAV）

6. **HTTPS**: 生产环境必须使用 HTTPS

7. **敏感操作二次确认**: 删除、修改等重要操作需要二次确认

---

## 已修复文件列表

### 后端文件
1. `server/routes/auth.js`
2. `server/routes/user.js`
3. `server/routes/upload.js`
4. `server/routes/confession.js`
5. `server/routes/comment.js`
6. `server/controllers/meController.js`
7. `server/app.js`
8. `server/database/supabase_schema.sql`

### 前端文件
9. `client/index.html`
10. `client/preview.html`
11. `client/utils/request.js`
12. `client/store/index.js`
13. `client/pages/login/login.vue`
14. `client/pages/profile/profile.vue`
15. `client/pages/post/post.vue`

---

修复日期: 2026-06-18

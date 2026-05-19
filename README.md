# 语音表白墙（Taking）

`Taking` 是一个以“匿名、声音、情绪表达”为核心的语音表白墙 / 倾诉社区项目。项目面向校园或轻社交场景，用户可以通过手机号验证码登录，以匿名身份发布语音内容，并围绕语音进行浏览、播放、点赞、评论、分类发现、榜单排行和举报治理。

本项目当前代码由 `uni-app` 前端与 `Node.js Express` 后端组成。后续系统规划将后端业务数据与音频资源统一迁移到 **Supabase**，由 Supabase 提供 PostgreSQL 数据库、对象存储、认证扩展能力和行级安全能力，Express 后端保留为业务接口层、鉴权适配层、风控治理层与第三方服务聚合层。

---

## 1. 项目简介

### 1.1 项目定位

`Taking` 不是传统图文社区，而是一个“声音优先”的匿名表达平台。

用户可以：

- 用语音记录无法直接说出口的情绪；
- 以匿名代号发布暗恋、失恋、感谢、道歉、吐槽等内容；
- 在广场中收听他人的声音故事；
- 对喜欢的语音点赞、评论或进入详情页互动；
- 通过分类与榜单发现高热度内容；
- 对违规内容进行举报，平台根据举报阈值和审核策略处理内容。

### 1.2 当前代码状态

当前仓库已经具备较完整的产品雏形：

- 前端已实现启动页、登录页、广场、发布页、详情页、分类页、榜单页、我的页、私信试运行页；
- 前端已封装认证、语音内容、评论、榜单、举报、用户相关 API；
- 后端已实现验证码登录、JWT 鉴权、语音发布、列表查询、详情查询、点赞、评论、举报、榜单、分类、音频上传等接口；
- 数据结构目前以 MySQL schema 表达，包含用户、分类、语音内容、评论、点赞、举报、播放记录、短信验证码等核心表；
- 后续规划将 MySQL + Redis + 本地上传逐步替换为 Supabase PostgreSQL + Supabase Storage + Supabase Auth / Edge Function / RLS 能力。

---

## 2. 系统总体规划

### 2.1 新架构目标

后端数据统一放在 Supabase，降低本地数据库、Redis、文件存储部署成本，同时提高项目可维护性和上线便利性。

规划后的架构如下：

```text
[uni-app Client]
  ├─ 页面层：welcome/login/index/post/detail/category/ranking/profile/chat
  ├─ 状态层：Pinia user store
  └─ API 层：统一 request / upload 封装
        │
        ▼
[Express Backend API]
  ├─ 认证适配：手机号验证码、JWT / Supabase Token 校验
  ├─ 业务接口：confession/comment/ranking/report/user/upload
  ├─ 风控治理：限流、敏感词、举报阈值、禁言/封禁判断
  └─ 第三方能力：短信、音频转码、审核、通知
        │
        ▼
[Supabase]
  ├─ PostgreSQL：用户、语音、评论、点赞、举报、播放记录、分类
  ├─ Storage：音频文件、头像等静态资源
  ├─ Auth：可选承载手机号登录或外部 JWT 映射
  ├─ RLS：行级权限控制
  └─ Edge Functions：可选承载轻量审核、统计、Webhook
```

### 2.2 分层职责

#### 前端层（`client`）

负责用户界面、交互体验、录音播放、表单提交、页面跳转和登录态缓存。

主要职责：

- 启动与登录流程；
- 语音广场信息流；
- 录音、预览、上传与发布；
- 语音详情、点赞与评论；
- 分类探索与随机发现；
- 热度榜单展示；
- 个人中心与用户统计；
- 私信页面的试运行展示。

#### 后端 API 层（`server`）

Express 不再直接依赖本地 MySQL，而是作为 Supabase 的业务代理层。

主要职责：

- 统一接口响应格式；
- 参数校验与异常处理；
- 登录态校验与用户状态判断；
- 内容发布前敏感词与权限校验；
- 调用 Supabase 查询和写入数据；
- 生成 Supabase Storage 上传路径或签名；
- 对点赞数、评论数、播放数等统计字段进行一致性更新；
- 处理举报、自动下架、禁言等治理策略。

#### Supabase 数据层

Supabase 作为核心后端数据平台。

主要职责：

- 使用 PostgreSQL 保存业务主数据；
- 使用 Storage 保存语音文件与头像；
- 使用 RLS 保护用户私有数据；
- 使用数据库函数 / 触发器维护部分计数字段；
- 可通过 Edge Functions 承担异步审核、统计刷新、通知推送等任务。

---

## 3. 功能模块构成

### 3.1 用户与认证模块

当前实现：

- 手机号验证码发送；
- 验证码登录 / 注册一体化；
- 首次登录自动生成匿名昵称与匿名编号；
- JWT 登录态保存；
- 用户状态支持正常、禁言、封禁。

Supabase 规划：

- 用户表迁移到 Supabase PostgreSQL 的 `profiles` 表；
- 可选择使用 Supabase Auth Phone OTP，也可以继续由 Express 接入短信服务并维护登录态；
- 用户敏感字段与公开字段拆分，手机号不向前端公开；
- 通过 RLS 限制用户只能更新自己的昵称、头像等信息。

### 3.2 语音发布模块

当前实现：

- 前端发布页支持分类选择、文字内容输入、App / 小程序录音；
- H5 端提示录音能力限制；
- 后端支持 Multer 本地上传音频；
- 发布接口写入分类、文字、音频 URL、时长等信息。

Supabase 规划：

- 音频文件上传到 Supabase Storage 的 `audios` bucket；
- 文件路径建议按用户与日期分区，例如：`audios/{userId}/{yyyy}/{mm}/{uuid}.mp3`；
- 数据表 `confessions` 只保存音频公开 URL 或 Storage path；
- 后端可增加音频时长校验、格式校验、大小限制和异步转码；
- 发布内容默认进入 `published` 或 `pending_review` 状态，由审核策略决定是否直接展示。

### 3.3 广场信息流模块

当前实现：

- 首页按最新、热门、播放量获取语音列表；
- 支持分类筛选；
- 支持下拉刷新和上拉加载；
- 卡片展示匿名昵称、分类、文字内容、语音波形、时长、点赞数、评论数、播放数。

Supabase 规划：

- 使用 PostgreSQL 查询构建列表接口；
- 热门排序可使用公式：`like_count * 2 + comment_count * 3 + play_count * 0.5`；
- 后续可增加全文搜索、标签筛选、推荐权重、分页游标；
- 对外只展示状态为 `published` 的内容。

### 3.4 语音详情与互动模块

当前实现：

- 详情页加载语音主体信息；
- 支持点赞 / 取消点赞；
- 支持评论列表加载与评论发布；
- 支持举报入口；
- 私信入口目前为试运行展示。

Supabase 规划：

- `likes` 表使用 `user_id + confession_id` 唯一约束防止重复点赞；
- 评论写入 `comments` 表，并通过触发器或后端逻辑维护 `comment_count`；
- 播放记录写入 `play_history`，避免同一用户或同一匿名 IP 重复计数；
- 举报写入 `reports`，达到阈值后自动将内容状态切换为 `hidden` 或 `pending_review`。

### 3.5 分类与榜单模块

当前实现：

- 分类页展示分类卡片和各分类内容数量；
- 支持随机发现热门内容；
- 榜单页支持日榜、周榜、月榜、总榜；
- 榜单按热度值排序。

Supabase 规划：

- `categories` 表保存分类名称、图标、排序、启用状态；
- 分类计数可通过 SQL 聚合实时查询，也可通过定时任务缓存；
- 榜单接口由 Express 调用 Supabase RPC 或 SQL View 实现；
- 可新增 `hot_score` 物化字段，按定时任务刷新。

### 3.6 用户中心模块

当前实现：

- 展示用户昵称、匿名编号；
- 展示发布语音数、获赞数等统计；
- 提供我的语音、收藏、关注、历史、通知、设置等入口；
- 部分入口目前为规划中提示。

Supabase 规划：

- `profiles` 表保存公开资料；
- `confessions`、`comments`、`likes` 聚合生成用户统计；
- 后续可补充收藏表、关注表、消息通知表、播放历史表；
- 个人中心逐步从静态入口升级为真实数据页面。

### 3.7 私信与社交模块

当前实现：

- `chat` 页面目前是试运行版，主要展示 UI 和交互占位；
- 支持从详情页携带昵称进入私信页；
- 暂未实现真实消息发送与实时通信。

Supabase 规划：

- 使用 Supabase Realtime 实现实时消息；
- 新增 `conversations` 与 `messages` 表；
- 消息类型支持文本、语音、系统提示；
- 私信功能应配合关注关系、黑名单与举报机制上线。

### 3.8 安全与治理模块

当前实现：

- Express 全局限流；
- 登录、上传、举报接口独立限流；
- 敏感词基础拦截；
- 举报去重；
- 举报数达到阈值后自动隐藏内容；
- IP 哈希存储用于风控，不保存明文 IP。

Supabase 规划：

- RLS 限制用户只能修改自己的资料、内容和评论；
- 举报、审核、封禁等管理操作仅允许 service role 或后台管理员执行；
- 使用 Supabase Edge Functions 或后台任务处理异步审核；
- 接入云审核服务后，对文本与音频进行双重审核；
- 所有管理动作保留审计日志。

---

## 4. 技术路线

### 4.1 前端技术路线

| 类型 | 技术 |
| --- | --- |
| 跨端框架 | uni-app |
| 视图框架 | Vue 3 |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 请求封装 | `uni.request` + `uni.uploadFile` |
| 录音播放 | `uni.getRecorderManager`、`uni.createInnerAudioContext` |
| 平台目标 | H5、微信小程序、App |

前端继续保持 `api` 目录统一封装接口，不建议在页面中直接写请求地址。后续迁移 Supabase 时，前端仍然优先请求 Express API，避免直接暴露过多业务表结构与 service role 权限。

### 4.2 后端技术路线

| 类型 | 当前实现 | Supabase 规划 |
| --- | --- | --- |
| Web 框架 | Express | 保留 Express |
| 参数校验 | express-validator | 保留 |
| 鉴权 | JWT | JWT / Supabase Auth 适配 |
| 业务数据库 | MySQL | Supabase PostgreSQL |
| 缓存 / 频控 | Redis | Supabase + 内存/外部 KV，可选 Upstash Redis |
| 文件上传 | Multer 本地存储 | Supabase Storage |
| 安全 | helmet、cors、rate-limit | 保留并增强 RLS |
| 音频处理 | fluent-ffmpeg | 保留，可异步处理 |

### 4.3 Supabase 数据路线

建议在 Supabase 中设计以下核心表：

```text
profiles
├─ id uuid primary key
├─ phone text unique
├─ nickname text
├─ avatar_url text
├─ anonymous_id text unique
├─ status text               -- active / muted / banned
├─ ip_hash text
├─ created_at timestamptz
└─ updated_at timestamptz

categories
├─ id bigint primary key
├─ name text
├─ icon text
├─ sort_order int
├─ status text               -- enabled / disabled
└─ created_at timestamptz

confessions
├─ id bigint primary key
├─ user_id uuid references profiles(id)
├─ category_id bigint references categories(id)
├─ title text
├─ content text
├─ audio_url text
├─ audio_path text
├─ audio_duration int
├─ audio_size int
├─ status text               -- published / hidden / pending_review / deleted
├─ like_count int
├─ comment_count int
├─ play_count int
├─ reported_count int
├─ is_featured boolean
├─ created_at timestamptz
└─ updated_at timestamptz

comments
├─ id bigint primary key
├─ confession_id bigint references confessions(id)
├─ user_id uuid references profiles(id)
├─ content text
├─ status text               -- visible / deleted / hidden
├─ created_at timestamptz
└─ updated_at timestamptz

likes
├─ id bigint primary key
├─ confession_id bigint references confessions(id)
├─ user_id uuid references profiles(id)
└─ created_at timestamptz

reports
├─ id bigint primary key
├─ target_type text           -- confession / comment
├─ target_id bigint
├─ reporter_id uuid references profiles(id)
├─ reason text
├─ description text
├─ status text                -- pending / handled / rejected
├─ handled_by uuid
├─ handled_at timestamptz
└─ created_at timestamptz

play_history
├─ id bigint primary key
├─ confession_id bigint references confessions(id)
├─ user_id uuid
├─ ip_hash text
└─ created_at timestamptz
```

建议约束：

- `likes` 增加唯一约束：`unique(confession_id, user_id)`；
- `reports` 增加待处理举报去重约束：`unique(target_type, target_id, reporter_id, status)` 或通过业务逻辑控制；
- `play_history` 对登录用户按 `confession_id + user_id` 去重，对未登录用户按 `confession_id + ip_hash` 去重；
- `profiles.status` 控制用户是否可发布、评论、登录。

### 4.4 Supabase Storage 路线

建议创建以下 bucket：

```text
audios      -- 语音文件
avatars     -- 用户头像
reports     -- 举报补充材料，可选
```

音频上传策略：

1. 前端选择或录制音频；
2. 请求 Express 获取上传策略或直接由 Express 代传；
3. 文件写入 Supabase Storage；
4. 后端校验文件大小、格式、时长；
5. 后端写入 `confessions` 表；
6. 返回发布成功。

---

## 5. UI 风格与设计规范

### 5.1 视觉基调

项目 UI 当前已经形成较明确的温柔治愈风格。

- 风格关键词：温柔、匿名、轻社交、情绪表达、陪伴感；
- 主色调：粉色渐变；
- 辅助色：淡紫、浅蓝、米黄、浅灰；
- 背景：大面积浅粉渐变与柔和装饰圆形；
- 内容容器：白色卡片、圆角、轻阴影；
- 情绪表达：使用 emoji、插画、小人、波形动效降低表达压力。

### 5.2 推荐色板

```text
Primary Pink      #FF6B9D
Soft Pink         #FF8FB3
Light Pink        #FFE4EC
Page Background   #FFF0F3
Card White        #FFFFFF
Text Main         #333333
Text Secondary    #999999
Warning Soft      #FFF4E4
Info Soft         #E4F8FF
Purple Soft       #F0E4FF
```

### 5.3 页面风格

- 启动页：品牌名 `Taking` 居中，搭配治愈插画和自动跳转；
- 登录页：卡片式表单，手机号验证码 + 昵称 + 协议确认；
- 广场页：语音卡片流，强调匿名头像、分类标签、波形播放器；
- 发布页：情绪分类优先，录音按钮居中突出；
- 详情页：沉浸式语音播放 + 评论互动；
- 分类页：渐变分类卡片，突出探索感；
- 榜单页：前三名领奖台视觉，强化成就感；
- 我的页：粉色头图 + 用户卡片 + 快捷入口；
- 私信页：当前为试运行版，应保持轻量提示，避免误导用户认为实时聊天已完成。

### 5.4 交互规范

- 所有关键操作必须有反馈：加载、成功、失败、空状态；
- 发布、评论、举报等写操作必须防重复提交；
- 播放状态必须可见，波形动效应与播放状态同步；
- 未登录用户触发点赞、评论、发布时，应引导登录；
- H5 端录音能力有限，应明确提示用户使用 App 或小程序；
- 举报、隐私、用户协议入口必须保留。

---

## 6. 当前项目目录

```text
voice-confession-wall/
├─ admin/                 # 管理后台（内容审核、举报处理）
├─ docs/                  # 项目文档（API、搭建、数据库）
├─ client/
│  ├─ api/                  # 前端 API 封装
│  │  ├─ auth.js
│  │  ├─ comment.js
│  │  ├─ confession.js
│  │  ├─ ranking.js
│  │  ├─ report.js
│  │  └─ user.js
│  ├─ pages/                # 页面
│  │  ├─ welcome/           # 启动页
│  │  ├─ login/             # 登录页
│  │  ├─ index/             # 语音广场
│  │  ├─ post/              # 发布语音
│  │  ├─ detail/            # 语音详情
│  │  ├─ category/          # 分类探索
│  │  ├─ ranking/           # 热度榜单
│  │  ├─ profile/           # 我的页面
│  │  └─ chat/              # 私信试运行页
│  ├─ store/                # Pinia 状态管理
│  ├─ utils/                # 请求工具
│  ├─ App.vue
│  ├─ main.js
│  ├─ pages.json
│  ├─ manifest.json
│  └─ vite.config.js
│
└─ server/
   ├─ config/               # 当前 MySQL / Redis 配置，后续替换 Supabase client
   ├─ database/             # 当前 MySQL schema，后续迁移为 Supabase SQL migration
   ├─ middleware/           # 鉴权与权限中间件
   ├─ routes/               # 业务路由
   ├─ services/             # 部分业务服务层
   ├─ utils/                # 工具函数与响应封装
   ├─ app.js
   └─ package.json
```

---

## 7. 后续 Supabase 迁移计划

### Phase 1：数据层迁移

- 在 Supabase 创建项目；
- 建立 `profiles`、`categories`、`confessions`、`comments`、`likes`、`reports`、`play_history` 表；
- 将当前 `server/database/schema.sql` 改写为 PostgreSQL migration；
- 初始化分类数据；
- 配置基础 RLS 策略；
- 后端新增 Supabase client 配置。

### Phase 2：接口层改造

- 替换 `mysqlPool.execute` 为 Supabase 查询；
- 重写认证中间件，使其支持 Supabase 用户 ID 或当前 JWT 用户 ID；
- 将语音列表、详情、发布、点赞、评论、举报接口切换到 Supabase；
- 将用户统计改为 Supabase 聚合查询或 RPC；
- 保持前端 API 调用路径不变，降低前端改造成本。

### Phase 3：文件存储迁移

- 创建 Supabase Storage bucket：`audios`、`avatars`；
- 替换本地 Multer 上传为 Supabase Storage 上传；
- 设计音频访问权限，公开内容可使用 public URL，待审核内容使用 signed URL；
- 增加音频大小、格式、时长校验；
- 可选接入 FFmpeg 转码压缩。

### Phase 4：治理与生产化

- 增加内容审核状态机；
- 增加管理员后台或 Supabase 管理视图；
- 接入短信服务；
- 接入文本与音频审核；
- 增加日志、监控、错误追踪；
- 增加接口测试和核心流程 E2E 测试。

---

## 8. 本地运行

### 8.1 前端运行

```bash
cd client
npm install
npm run dev:h5
```

也可以运行到小程序或 App：

```bash
npm run dev:mp-weixin
npm run dev:app
```

### 8.2 当前后端运行

当前后端仍是 MySQL + Redis 版本：

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

默认端口：

```text
前端 H5：3001
后端 API：3000
```

### 8.3 Supabase 版本环境变量规划

后续迁移到 Supabase 后，`.env` 建议增加：

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_AUDIO_BUCKET=audios
SUPABASE_STORAGE_AVATAR_BUCKET=avatars
JWT_SECRET=your-jwt-secret
CLIENT_ORIGIN=http://localhost:3001
```

注意：`SUPABASE_SERVICE_ROLE_KEY` 只能放在后端，不能出现在前端代码中。

---

## 9. 当前优先级建议

建议按以下顺序继续开发：

1. 修正 `pages.json` 中 tabBar 引用的 `category`、`ranking` 页面未出现在 `pages` 数组的问题；
2. 将 `detail` 页播放器从占位状态改成真实音频播放；
3. 将 `post` 页 H5 录音限制与 App / 小程序录音体验分离处理；
4. 设计 Supabase PostgreSQL migration；
5. 后端新增 Supabase client，并逐步替换 MySQL 查询；
6. 上传接口迁移到 Supabase Storage；
7. 完善个人中心真实列表：我的语音、我的评论、收听历史；
8. 再考虑私信、关注、收藏、通知等扩展社交能力。

---

## 10. 项目总结

`Taking` 当前已经具备语音表白墙的核心产品形态：匿名登录、语音发布、广场浏览、详情互动、分类发现、榜单排行、举报治理。后续将后端数据放在 Supabase 后，可以显著降低数据库和文件服务的部署复杂度，并为实时私信、权限控制、对象存储、管理后台和生产化审核能力打下基础。

项目后续的关键不是单纯堆功能，而是围绕“声音表达”和“匿名安全”两个核心目标，持续完善真实数据链路、内容治理能力和温柔治愈的交互体验。

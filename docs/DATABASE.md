# 数据库说明

业务数据存放在 **Supabase PostgreSQL**。完整建表脚本见：

- `server/database/supabase_schema.sql`（推荐）
- `server/database/schema.sql`（历史 MySQL 版本，仅供参考）

## 核心表

| 表名 | 用途 |
| --- | --- |
| `profiles` | 用户资料、匿名昵称、账号状态 |
| `categories` | 语音分类 |
| `confessions` | 语音表白内容 |
| `comments` | 评论 |
| `likes` | 点赞记录 |
| `reports` | 举报记录 |
| `play_history` | 播放记录 |

## 状态枚举

### profiles.status

- `active` — 正常
- `muted` — 禁言
- `banned` — 封禁

### confessions.status

- `published` — 已发布，广场可见
- `pending_review` — 待审核（举报达阈值后自动进入）
- `hidden` — 已隐藏
- `deleted` — 已删除

### reports.status

- `pending` — 待处理
- `handled` — 已处理
- `rejected` — 已驳回

### comments.status

- `visible` / `hidden` / `deleted`

## 举报自动下架

当某条 `confessions` 被举报且 `reported_count >= 5` 时，后端会将该内容 `status` 更新为 `pending_review`，需在管理后台人工审核。

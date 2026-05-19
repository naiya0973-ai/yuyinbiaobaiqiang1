# API 文档

- 基础路径：`/api`
- 默认端口：`3000`
- 响应格式：`{ code, message, data }`，`code === 0` 表示成功

## 认证

用户接口在请求头携带：

```http
Authorization: Bearer <jwt>
```

管理接口在请求头携带：

```http
X-Admin-Token: <ADMIN_TOKEN>
```

## 健康检查

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务状态 |

## 认证 `/api/auth`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/send-code` | 否 | 发送验证码 |
| POST | `/login` | 否 | 手机号 + 验证码登录 |
| GET | `/me` | 是 | 当前用户信息 |
| PUT | `/profile` | 是 | 更新昵称/头像 |

## 语音 `/api/confession`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/list` | 可选 | 列表，`sort=newest\|hot\|popular`，`category`，分页 |
| GET | `/user/my` | 是 | 我的发布 |
| GET | `/:id` | 可选 | 详情 |
| POST | `/` | 是 | 发布语音 |
| DELETE | `/:id` | 是 | 删除自己的语音 |
| POST | `/:id/like` | 是 | 点赞/取消点赞 |

## 评论 `/api/comment`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/:confessionId` | 否 | 评论列表 |
| POST | `/` | 是 | 发表评论 |
| DELETE | `/:id` | 是 | 删除自己的评论 |

## 上传 `/api/upload`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/audio` | 是 | 上传音频（multipart `audio`） |
| DELETE | `/audio/:filename` | 是 | 删除已上传文件 |

## 榜单 `/api/ranking`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/hot` | 否 | 热度榜，`period=day\|week\|month\|all` |
| GET | `/categories` | 否 | 分类及数量 |

## 举报 `/api/report`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/` | 是 | 提交举报 |
| GET | `/reasons` | 否 | 举报原因列表 |

## 用户 `/api/user`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/profile` | 是 | 个人资料与统计 |
| PUT | `/profile` | 是 | 更新资料 |
| GET | `/confessions` | 是 | 我的语音 |
| GET | `/comments` | 是 | 我的评论 |

## 管理 `/api/admin`

需 `X-Admin-Token` 请求头。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/stats` | 概览统计 |
| GET | `/reports` | 举报列表，`status=pending\|handled\|rejected` |
| PATCH | `/reports/:id` | 处理举报，`{ action: "handled" \| "rejected" }` |
| GET | `/confessions` | 内容列表，`status=pending_review\|published\|hidden` |
| PATCH | `/confessions/:id` | 更新内容状态，`{ status: "published" \| "hidden" \| "deleted" }` |

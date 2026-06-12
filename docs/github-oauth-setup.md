# GitHub OAuth 登录配置

博客管理后台使用 GitHub OAuth Authorization Code Web Flow 登录。实现包含随机
`state`、PKCE S256、一次性加密 Cookie、博客自己的 HttpOnly Session Cookie，以及
基于 GitHub 稳定数值用户 ID 的管理员授权。

## 1. 创建 OAuth App

在 GitHub 打开：

`Settings -> Developer settings -> OAuth Apps -> New OAuth App`

本地开发建议填写：

```text
Homepage URL: http://localhost:3000
Authorization callback URL:
http://localhost:3000/api/auth/github/callback
```

生产环境应单独创建 OAuth App，并把两个地址替换为线上 HTTPS 域名。GitHub OAuth App
只能配置一个 Callback URL，因此开发与生产分开最省事。

## 2. 配置环境变量

复制 `.env.example` 中的变量到本地 `.env` 或 Vercel Environment Variables：

```text
GITHUB_OAUTH_CLIENT_ID=<OAuth App Client ID>
GITHUB_OAUTH_CLIENT_SECRET=<OAuth App Client Secret>
GITHUB_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
AUTH_SECRET=<至少 32 个字符的随机值>
GITHUB_ADMIN_IDS=<你的 GitHub 数值用户 ID>
```

生成 Session 密钥：

```bash
openssl rand -base64 48
```

查询 GitHub 数值用户 ID：

```bash
curl https://api.github.com/users/<github-login>
```

取响应中的 `id` 字段。多个管理员使用英文逗号分隔，例如 `123,456`。

不要把真实 Client Secret、`AUTH_SECRET` 或访问 Token 提交到 Git。

## 3. 本地运行

```bash
pnpm dev
```

访问 `http://localhost:3000/admin`，点击“使用 GitHub 登录”。本地必须保持
`AUTH_COOKIE_SECURE=false`，线上 `NODE_ENV=production` 时 Cookie 会自动启用
`Secure`。

## 4. 安全边界

- 登录只请求 GitHub 基础公开身份，不申请 `repo` 或 `user:email`。
- GitHub Access Token 仅用于回调时请求 `/user`，不会保存到 Cookie、浏览器存储或仓库。
- 文章、分类、关于页修改与评论删除都在服务端校验博客 Session。
- 登录 Session 有效期 7 天；OAuth 临时事务有效期 10 分钟且回调后立即清除。
- 修改 `AUTH_SECRET` 会使现有 Session 全部失效。

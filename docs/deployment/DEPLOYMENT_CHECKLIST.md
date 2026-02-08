# 部署与验证全流程清单

- 目标：把所有需要“输入/配置/执行/验证”的内容一次性列清楚，照单完成即可跑通本地与线上
- 适用：本地开发、自托管、Vercel 部署

## 1. Supabase 项目与数据库
- 创建项目并记录 Project Ref
- 打开 SQL Editor 执行建表与 RLS 脚本（见迁移指南）：
  - 启用扩展 pgcrypto
  - 创建 documents 表（含 user_id、metadata、root、时间戳）
  - 启用 RLS 并添加四个策略（SELECT/INSERT/UPDATE/DELETE 均限定 auth.uid() = user_id）
  - 创建触发器自动更新 updated_at
- 验证 Table Editor 能看到 documents 表

## 2. OAuth 登录（GitHub）
- Supabase → Authentication → Providers：启用 GitHub
- 在 GitHub 开发者设置创建 OAuth App：
  - Homepage URL: http://localhost:3000（开发）或你的生产域名（线上）
  - Authorization callback URL: https://你的项目ref.supabase.co/auth/v1/callback
- 在 Supabase 的 GitHub Provider 设置 Client ID/Secret
- Supabase → Authentication → Settings：
  - Site URL：你的域名（开发可用 http://localhost:3000）
  - Additional Redirect URLs：加入你的域名（开发或生产）

## 3. 环境变量（本地与线上）
- 必填：
  - NEXT_PUBLIC_SUPABASE_URL（Supabase Dashboard → Settings → API）
  - NEXT_PUBLIC_SUPABASE_ANON_KEY（同上）
- 生产门禁（可选）：
  - APP_ACCESS_PASSWORD（仅生产启用）
- 修改后重启服务（本地），或在平台环境变量界面保存后重新部署（线上）

## 4. 本地运行与联通检查
- 运行开发服务：npm run dev
- 打开健康检查：http://localhost:3000/api/supabase-health 期望：
  - {"ok": true, "reachable": true, "dataCount": N}
- 登录流程：
  - 打开 http://localhost:3000/login，选择“使用 GitHub 登录”
  - 登录成功后访问首页，不再被跳转（路由守卫通过）
- 数据流验证：
  - 侧边栏点击“+ 新建文档”，编辑后自动保存
  - 列表显示新文档（倒序）
  - 将文档移到回收站并“永久删除”，列表刷新且 Supabase documents 表相应记录消失

## 5. 生产部署（二选一）
- Vercel（推荐）：
  - 在 Vercel 项目设置里添加环境变量（同本地）
  - 部署完成后将生产域名填入 Supabase → Authentication → Settings 的 Site URL 与 Redirect URLs
  - 打开你的生产域名，重复“4. 本地运行与联通检查”的所有验证步骤
- 自托管（Linux 服务器）：
  - 安装 Node.js 18+，准备 Nginx/Caddy 与 HTTPS
  - 设置环境变量（系统或进程管理器）
  - 构建与启动：npm install → npm run build → NODE_ENV=production PORT=3000 npm run start
  - 用反向代理把域名指向 3000，完成 HTTPS
  - 在 Supabase Settings 填写域名，重复“4. 本地运行与联通检查”的验证步骤

## 6. 门禁与路由守卫
- 开发环境不启用门禁（middleware 自动跳过）
- 生产环境如需门禁：设置 APP_ACCESS_PASSWORD 后，首次进入跳到 /access
- 未登录路由守卫已启用：除 /login、/access 外未登录会跳到 /login

## 7. 常见问题与排查
- Unsupported provider: provider is not enabled
  - 在 Supabase Providers 启用对应 Provider
  - 检查 GitHub OAuth App 的 Callback URL 与 Supabase Project Ref 一致
  - Supabase Settings 的 Site URL/Redirect URLs 包含你的域名
- 密码错误（门禁）
  - APP_ACCESS_PASSWORD 未设置或服务未重启
  - 输入的门禁密码与 .env 配置不一致
- 登录后列表为空
  - RLS 限制：只会看到 user_id 为自己的数据；确认保存时已带 user_id
  - 表未创建或字段不匹配：按迁移脚本重新创建
- 移动端或内嵌 WebView 无法通过门禁
  - 已做双通道 Cookie 兼容，仍异常可先关闭门禁或仅生产启用

## 8. 进一步增强（可选）
- 清空回收站接入 Supabase 批量删除
- 健康检查页面：展示环境变量、Supabase 联通、Auth 状态
- README 添加“生产部署与验证”章节，标准化团队流程


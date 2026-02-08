# 部署文档

本目录包含项目部署相关的配置和指南。

## 📋 文档列表

| 文档 | 描述 |
|------|------|
| [SUPABASE_MIGRATION-guide.md](./SUPABASE_MIGRATION-guide.md) | Supabase 云数据库迁移指南 - 多设备同步、云端备份 |
| [ZHIPU_AI_SETUP-guide.md](./ZHIPU_AI_SETUP-guide.md) | 智谱 AI API 配置指南 - AI 重组功能配置 |
| [.env.local.example](./.env.local.example) | 环境变量配置示例 |

## 🚀 快速部署

### 本地开发

1. **复制环境变量配置**
   ```bash
   cp docs/deploy/.env.local.example .env.local
   ```

2. **配置必需的环境变量**
   编辑 `.env.local` 文件，添加你的 API Keys

3. **安装依赖并启动**
   ```bash
   npm install
   npm run dev
   ```

### 生产部署（Vercel）

1. **连接 Git 仓库**
   - 访问 [Vercel](https://vercel.com)
   - 导入你的 GitHub 仓库

2. **配置环境变量**
   在 Vercel 项目设置中添加：
   - `ZHIPU_API_KEY` (智谱 AI)
   - `OPENAI_API_KEY` (OpenAI，可选)

3. **部署**
   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy" 开始部署

## 🔧 配置项说明

### 必需配置

| 环境变量 | 说明 | 获取方式 |
|---------|------|----------|
| `ZHIPU_API_KEY` | 智谱 AI API Key | [智谱AI开放平台](https://open.bigmodel.cn) |

### 可选配置

| 环境变量 | 说明 | 获取方式 |
|---------|------|----------|
| `OPENAI_API_KEY` | OpenAI API Key | [OpenAI Platform](https://platform.openai.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | [Supabase Dashboard](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key | [Supabase Dashboard](https://supabase.com) |

## 📚 部署平台

### Vercel（推荐）
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 零配置部署
- ✅ 免费额度充足

### Netlify
- ✅ 自动部署
- ✅ 表单处理
- ✅ Serverless Functions

### 自托管
- ✅ 完全控制
- ✅ 数据隐私
- ❌ 需要运维

## 🔐 安全注意事项

1. **永远不要提交 `.env.local` 到 Git**
2. **生产环境使用专用 API Key**
3. **定期轮换密钥**
4. **启用速率限制**（生产环境）
5. **使用 HTTPS**（强制）

## 📖 更多信息

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 环境变量指南](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 部署最佳实践](https://supabase.com/docs/guides/platform/deployment)

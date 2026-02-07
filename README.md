# 大纲编辑器

> 基于 Next.js 的 AI 智能大纲整理工具，类似幕布的笔记应用

一个强大的大纲编辑器，支持无限层级、AI 智能重组、图片插入、撤销重做等功能。

## 核心特性

- ✅ **自由编辑的大纲笔记** - 类似幕布的编辑体验
- ✅ **无限层级支持** - 支持任意深度的层级嵌套
- ✅ **折叠/展开** - 便捷的节点折叠和展开
- ✅ **AI 智能重组** - 自动识别主题并建立层级分类（核心功能）
- ✅ **图片插入** - 支持第三方图床（Imgur、SM.MS、自定义）
- ✅ **数据持久化** - 基于 IndexedDB 的本地存储
- ✅ **导入/导出** - JSON 格式的文档导入导出
- ✅ **撤销/重做** - 完整的历史记录管理

## 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **状态管理**: Zustand + Immer
- **本地存储**: Dexie.js (IndexedDB)
- **AI 集成**: Vercel AI SDK (OpenAI/Claude/Gemini)
- **类型验证**: Zod

## 开始使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填写 API Key：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 填写你的 API Key（可选）：

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 构建生产版本

```bash
npm run build
npm run start
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── ai/            # AI 相关接口
│   │   └── upload/        # 图床上传代理
│   └── actions/          # Server Actions
├── components/           # React 组件
│   ├── editor/          # 大纲编辑器
│   ├── ai/              # AI 功能组件
│   └── ui/              # 基础 UI 组件
├── lib/                 # 核心逻辑
│   ├── db.ts           # IndexedDB 封装
│   ├── store.ts        # Zustand Store
│   ├── ai.ts           # AI SDK 调用
│   └── image.ts        # 图床上传
├── types/              # TypeScript 类型
└── utils/              # 工具函数
```

## 开发规范

- 前端开发规范详见：[前端开发规范.md](./前端开发规范.md)
- 后端开发规范详见：[后端开发规范.md](./后端开发规范.md)
- 设计规格详见：[spec-draft.md](./spec-draft.md)

## 核心功能说明

### AI 智能重组

通过 AI 自动分析你的大纲内容，识别主题并建立合理的层级分类关系。

**使用方式：**
1. 点击工具栏的"✨ AI 整理"按钮
2. AI 分析当前大纲结构
3. 展示重组预览（并排对比）
4. 确认后应用重组结果

### 图片插入

支持多种方式插入图片：
- 菜单栏「添加图片」按钮
- 快捷键 `Alt + Enter`（Mac: `Option + Enter`）
- 直接拖拽图片到编辑器
- 复制粘贴图片

图片会上传到配置的图床服务，并显示缩略图，点击可查看原图。

### 数据持久化

- 所有文档自动保存到浏览器 IndexedDB
- 支持导出为 JSON 文件备份
- 支持导入 JSON 文件恢复数据

## MVP 阶段限制

- **不支持文件夹功能** - 所有文档平铺展示
- **单设备使用** - 数据仅存储在本地浏览器
- **图床需自行配置** - 支持第三方图床服务

## 后续迭代计划

- V2: 文件夹管理、多设备同步
- V3: 协作功能、云端存储
- V4: 移动端适配

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

---

*本项目基于 Next.js 14 + TypeScript + Zustand + Dexie.js 构建*

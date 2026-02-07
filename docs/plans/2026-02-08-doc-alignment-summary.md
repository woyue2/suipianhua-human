# 文档对齐总结

> 生成时间：2026-02-08

## 📋 对齐完成

三个核心文档已全部对齐：
- ✅ `spec-draft.md` - 设计规格草案
- ✅ `前端开发规范.md` - 前端开发规范
- ✅ `后端开发规范.md` - 后端开发规范

---

## 🔑 关键对齐点

### 1. 文档列表同步（MVP 阶段）

**前端开发规范：**
- ✅ 新增 7.4 文档列表同步规范
- 包含完整的数据流、API 调用、Store 状态管理

**后端开发规范：**
- ✅ 新增 2.4 文档列表 API
- 包含完整的接口实现、返回格式、MVP 限制说明

**设计规格草案：**
- ✅ 新增"文档列表管理（MVP 阶段）"章节
- 包含完整的实现代码和组件示例

**一致性：**
- API 路径：`GET /api/documents`
- 响应格式：`{ success: true, data: documents }`
- 数据结构：`Array<{ id, title, updatedAt }>`
- MVP 限制：平铺展示，无文件夹嵌套

---

### 2. 文件夹功能（MVP 不实现）

**前端开发规范：**
- ✅ 7.4 中说明"所有文档平铺展示，不支持文件夹功能"
- ✅ 后续迭代可扩展文件夹筛选逻辑

**后端开发规范：**
- ✅ 新增 3.4 "MVP 阶段数据模型限制"
- ✅ 明确说明不支持文件夹嵌套结构
- ✅ 列出后续迭代方向（V2+）

**设计规格草案：**
- ✅ "次要功能"章节新增"文件夹功能（后续迭代）"部分
- ✅ 明确核心目标聚焦、简化实现、后续迭代方向

**一致性：**
- MVP 阶段：所有文档平铺展示，无 folderId 字段
- 排序方式：按更新时间降序
- V2+ 扩展：Folder 实体、嵌套结构、拖拽排序

---

### 3. AI 集成（Vercel AI SDK）

**前端开发规范：**
- ✅ 7.2 提及 AI 调用逻辑封装在 `app/actions/ai.ts`
- ✅ 使用 `generateObject` + Zod Schema

**后端开发规范：**
- ✅ 第四章详细说明 AI 集成规范
- ✅ 包含 Prompt 设计、输出验证示例

**设计规格草案：**
- ✅ "AI 智能重组"章节包含完整实现
- ✅ Zod Schema 定义（`lib/ai-schema.ts`）
- ✅ Diff 算法局限性说明

**一致性：**
- AI Schema 定义在 `lib/ai-schema.ts`
- 使用 `generateObject` + Zod 确保类型安全
- Prompt 明确要求"只返回 JSON 结构，不要包含 ID"

---

### 4. 图床上传（代理模式）

**前端开发规范：**
- ✅ 7.3 详细说明图床上传规范
- ✅ 配置通过 headers 传递

**后端开发规范：**
- ✅ 2.3 参数验证包含图床上传示例
- ✅ 完整的 UploadConfigSchema 定义

**设计规格草案：**
- ✅ "图床上传功能"章节包含完整实现
- ✅ IMAGE_PROVIDERS 配置结构
- ✅ 文件校验、错误处理、URL 校验

**一致性：**
- 后端代理：`app/api/upload/route.ts`
- 配置传递：通过 headers（`x-image-provider`、`x-image-api-key`、`x-image-custom-url`）
- 统一错误格式：`{ success, error }`
- 文件校验：5MB 大小限制、图片类型白名单

---

### 5. 数据结构转换

**设计规格草案：**
- ✅ 区分 `StoredOutlineNode`（存储层）和 `OutlineNode`（渲染层）
- ✅ Store 存储扁平化：`nodes: Record<string, StoredOutlineNode>`
- ✅ `buildDocumentTree()` 构建完整 Document
- ✅ `loadDocument()` 扁平化到 Store

**前端开发规范：**
- ✅ 4.1 明确 Store 定义使用扁平化存储
- ✅ 4.2 强调使用 selector 精准订阅

**后端开发规范：**
- ✅ 3.1 数据模型映射与前端类型定义一致
- ✅ 3.2 所有 DB 操作封装在 `lib/db.ts`

**一致性：**
- 扁平化存储：children 存储 ID 数组（`string[]`）
- 树形渲染：children 存储对象数组（`OutlineNode[]`）
- 保存时转换：`buildDocumentTree()` → Document 对象
- 加载时转换：`loadDocument()` → 扁平 Store

---

### 6. 技术栈统一

**三个文档都使用：**
- Next.js 14+ (App Router)
- TypeScript（强模式）
- Zustand + Immer
- Dexie.js (IndexedDB)
- Vercel AI SDK + Zod
- Tailwind CSS + shadcn/ui

**一致性：**
- 所有文档明确技术栈版本
- 统一的包管理工具建议（npm/pnpm/yarn）
- 统一的 IDE 推荐（VS Code + ESLint + Prettier）

---

## 📊 文档职责划分

### `spec-draft.md` - 设计规格草案
**职责：**
- 完整的产品设计
- 核心功能详细实现
- 数据结构定义
- UI/UX 设计说明
- 开发优先级

**包含：**
- 项目概述
- 核心特性
- 技术栈
- 数据模型（StoredOutlineNode + OutlineNode）
- 整体架构
- 核心功能设计（编辑器、AI 重组、图床上传、数据持久化、工具栏、撤销/重做）
- 关键技术决策
- 开发优先级（Phase 1-5）

---

### `前端开发规范.md` - 前端开发规范
**职责：**
- 前端代码组织规范
- 组件开发规范
- 状态管理规范
- 样式与 UI 规范
- Hooks 封装规范

**包含：**
- 技术栈与工具链
- 项目结构与目录约定
- Next.js 与 React 组件规范（'use client'、Props 设计、性能优化）
- 状态管理：Zustand + Immer（扁平化存储、selector 订阅）
- 类型定义与数据流
- 样式与 UI 组件（Tailwind CSS、shadcn/ui）
- 持久化与外部 API 调用（IndexedDB、AI 调用、图床上传、文档列表同步）
- Hooks 封装与复用
- 错误处理与用户反馈
- 命名与注释规范
- Git 提交信息与协作规范

---

### `后端开发规范.md` - 后端开发规范
**职责：**
- 后端代码组织规范
- API 设计规范
- 数据库操作规范
- 安全与权限规范
- 性能优化规范

**包含：**
- 项目结构与职责划分（app/api/、app/actions/）
- API 设计规范（基础结构、响应格式、参数验证、文档列表 API）
- 数据持久化与数据库操作（数据模型映射、CRUD 操作、事务处理、MVP 限制）
- AI 集成规范（Prompt 设计、输出验证）
- 安全与权限（API Key 管理、输入验证、CORS 配置）
- 性能优化（流式处理、数据库查询优化）
- 代码风格与最佳实践（TypeScript 类型、错误处理、日志记录）
- 测试规范（单元测试、集成测试）
- 部署与运维（环境变量、监控）

---

## 🎯 对齐后的关键要点

### MVP 阶段明确边界
1. **不支持文件夹功能** - 所有文档平铺展示
2. **文档列表 API** - `/api/documents` 返回所有文档
3. **扁平化存储** - Store 使用 `Record<string, StoredOutlineNode>`
4. **数据转换** - `buildDocumentTree()` 和 `loadDocument()` 负责转换

### 架构预留扩展性
1. **文件夹功能** - 后续可添加 Folder 实体，无需大规模重构
2. **API 扩展** - 可通过查询参数传递 folderId
3. **数据模型** - 已考虑嵌套需求，易于扩展

### 三个文档互补
1. **spec-draft.md** - 完整的设计和实现细节
2. **前端开发规范.md** - 前端开发者的操作指南
3. **后端开发规范.md** - 后端开发者的操作指南

---

## ✅ 对齐完成检查清单

- [x] 文档列表 API 在三个文档中一致
- [x] 文件夹功能 MVP 限制在三个文档中明确
- [x] AI 集成规范对齐（Zod Schema、generateObject）
- [x] 图床上传规范对齐（headers、错误处理、文件校验）
- [x] 数据结构转换对齐（扁平化 ↔ 树形）
- [x] 技术栈版本对齐
- [x] 目录结构对齐

---

## 📝 后续维护建议

1. **同步更新** - 当修改任一文档时，检查是否需要更新其他两个文档
2. **交叉引用** - 在文档中适当引用其他文档（如"详见后端开发规范 2.4"）
3. **版本控制** - 三个文档保持相同的版本号（如 v1.0.0）
4. **Review 流程** - 重大功能变更时，同时 Review 三个文档的一致性

---

*对齐完成时间：2026-02-08*

# 大纲编辑器 - 设计规格草案

> 基于 Next.js 的 AI 智能大纲整理工具

## 项目概述

一个类似幕布的大纲笔记应用，核心功能是**AI 智能重组** - 分析用户的大纲内容，自动识别主题并建立层级分类关系。

### 核心特性
- ✅ 自由编辑的大纲笔记（类似幕布体验）
- ✅ 无限层级支持，折叠/展开
- ✅ 图片插入（支持第三方图床）
- ✅ AI 智能重组大纲结构（核心功能）
- ✅ JSON 格式导入/导出
- ✅ 极简 UI 设计（类似幕布）

### 次要功能（可后续迭代）
- 搜索功能
- 快捷键支持
- 撤销/重做

### 文件夹功能（后续迭代）
**MVP 阶段不实现文件夹功能，原因：**

1. **核心目标聚焦**
   - MVP 的核心是验证核心功能闭环：编辑、AI 重组、保存、导入导出
   - 文件夹属于文档组织管理的次要功能，不影响核心体验验证

2. **简化实现**
   - MVP 阶段使用**平铺的文档列表**（所有文档展示在同一列表中）
   - 通过标题或创建时间排序，满足基本文档管理需求
   - 减少数据模型复杂度（无需 Folder 实体、嵌套关系、folderId 字段）

3. **后续迭代方向**
   - V2+ 可扩展文件夹功能：
     - 新增 Folder 实体（id、name、children）
     - 支持文件夹展开/折叠 UI
     - 支持拖拽排序和右键菜单
   - 当前架构已预留扩展性（通过 API + Zustand 模式）

---

## 技术栈

### 核心框架
- **Next.js 14+** (App Router) - 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **shadcn/ui** - UI 组件库

### 状态管理
- **Zustand** - 全局状态管理
- **Zustand Immer 中间件** - 处理深度嵌套数据

### 数据存储
- **IndexedDB (Dexie.js)** - 本地数据持久化
- **JSON 文件** - 导入/导出

### AI 集成
- **Vercel AI SDK** - 统一 AI 接口
- **Zod** - AI 输出类型验证
- **支持多提供商**: Claude | OpenAI | Gemini

### 图床上传
- **用户配置第三方图床** (Imgur | SM.MS | 自定义)
- **Next.js Route Handlers** - 上传代理

---

## 数据模型

### 核心实体

```typescript
// === 核心业务实体 ===

// 定义扁平化的节点（用于 Store 存储层）
// children 存储 ID 数组，实现真正的扁平化
interface StoredOutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: string[];          // [关键修正] 存储 ID 数组，而非对象数组
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

// 定义树形节点（用于 UI 渲染和导出）
// children 是对象数组，方便组件直接使用
interface OutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: OutlineNode[];     // 渲染时使用对象数组
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ImageAttachment {
  id: string;
  url: string;
  thumbnail?: string;
  width: number;
  height: number;
  alt?: string;                 // [新增] 语义化信息
  caption?: string;             // [新增] 图片说明
  uploadedAt: number;
}

interface Document {
  id: string;
  title: string;
  root: OutlineNode;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

// === AI 功能实体 ===

interface ReorganizePlan {
  originalStructure: OutlineNode;
  proposedStructure: OutlineNode;
  changes: ReorganizeChange[];
  reasoning: string;
}

interface ReorganizeChange {
  type: 'move' | 'rename' | 'merge' | 'split' | 'create_category';
  description: string;
  fromPath: string[];           // [修正] ID 路径
  toPath: string[];             // [修正] ID 路径
}

// === 配置实体 ===

interface UserConfig {
  aiProvider: 'claude' | 'openai' | 'gemini';
  apiKeys: {
    claude?: string;
    openai?: string;
    gemini?: string;
  };
  imageUpload: {
    provider: 'imgur' | 'smms' | 'custom';
    customUrl?: string;
    apiKey?: string;
  };
}
```

---

## 整体架构

### 前后端一体化架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 全栈应用                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   前端 (客户端)   │         │   后端 (服务端)   │          │
│  ├──────────────────┤         ├──────────────────┤          │
│  │ • React 组件      │         │ • API Routes     │          │
│  │ • Zustand Store   │◄───────►│ • Server Actions│          │
│  │ • 交互逻辑        │         │ • AI 调用        │          │
│  │ • IndexedDB       │         │ • 图床上传代理    │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

数据流:
  用户操作 → Zustand Store → 更新内存状态
                           ↓
                     同步到 IndexedDB

  AI 重组 → 前端触发 → Server Action → AI API
                           ↓
                     返回重组计划 → 前端确认 → 应用变更

  图床上传 → 前端选择 → Route Handler → 图床 API
                           ↓
                     返回图片 URL → 插入大纲
```

### 目录结构

```
src/
├── app/                          # Next.js App Router (路由层)
│   ├── api/                      # API 路由 (后端代理)
│   │   ├── ai/                   # AI 流式转发等
│   │   │   └── reorganize/       # AI 重组接口
│   │   └── upload/               # 图片上传代理
│   ├── actions/                  # Server Actions (逻辑层)
│   │   └── index.ts              # 统一导出所有服务端操作
│   ├── layout.tsx                # 全局布局
│   └── page.tsx                  # 入口页面
│
├── components/                   # React 组件 (展示层)
│   ├── editor/                   # 核心业务：大纲编辑器组件
│   │   ├── Editor.tsx            # 主编辑器容器
│   │   ├── OutlineTree.tsx       # 大纲树渲染器
│   │   ├── OutlineNode.tsx       # 递归节点组件
│   │   ├── NodeToggle.tsx        # 折叠/展开箭头
│   │   ├── NodeContent.tsx       # 可编辑内容
│   │   ├── NodeImages.tsx        # 图片附件
│   │   └── ImageUploader.tsx     # 图片上传器
│   ├── ai/                       # 核心业务：AI 交互面板
│   │   ├── AIReorganizeModal.tsx # AI 重组弹窗
│   │   ├── PlanPreview.tsx       # 重组计划展示
│   │   └── ConfirmButtons.tsx    # 确认/取消按钮
│   ├── ui/                       # 基础 UI (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   └── Toolbar.tsx               # 工具栏
│
├── lib/                          # 第三方库封装 & 核心逻辑
│   ├── db.ts                     # IndexedDB 封装 (Dexie.js)
│   ├── store.ts                  # Zustand 状态定义
│   ├── ai.ts                     # AI SDK 调用逻辑
│   ├── ai-schema.ts              # Zod Schema 定义
│   └── image.ts                  # 图床 SDK 封装
│
├── types/                        # TypeScript 类型定义
│   └── index.ts                  # 统一导出所有类型
│
└── utils/                        # 纯工具函数
    ├── tree-diff.ts              # 树差异计算算法
    ├── format.ts                 # 格式化工具
    └── id.ts                     # ID 生成（使用 crypto.randomUUID()）
```

### UUID 生成

**使用浏览器原生 API（无需额外依赖）：**

```typescript
// utils/id.ts
/**
 * 生成唯一的 ID
 * 使用浏览器原生 crypto.randomUUID() (现代浏览器和 Node.js 20+ 都支持)
 */
export const generateId = () => crypto.randomUUID();
```

---

## 核心功能设计

### 1. 大纲编辑器

#### 1.1 输入控件选择
```typescript
// ✅ 推荐：使用 input + CSS 去掉边框
<input
  type="text"
  value={content}
  className="border-none bg-transparent outline-none"
  onChange={(e) => updateNodeContent(id, e.target.value)}
/>

// ❌ 不推荐：contenteditable（光标管理极其复杂）
<div contentEditable={true}>{content}</div>
```

#### 1.2 性能优化策略

**扁平化 Store 存储**
```typescript
// lib/store.ts
interface EditorStore {
  // 扁平化存储：所有节点平铺在字典中
  nodes: Record<string, StoredOutlineNode>; // [修正] 使用存储类型
  rootId: string;
  documentId: string; // 文档 ID
  title: string;

  // Actions - 直接通过 ID 操作，O(1) 复杂度
  updateNodeContent: (id: string, content: string) => void;
  toggleCollapse: (id: string) => void;
  addImage: (nodeId: string, image: ImageAttachment) => void;
  applyReorganizePlan: (plan: ReorganizePlan) => void;

  // 辅助方法
  buildDocumentTree: () => Document; // [新增] 从扁平数据构建 Document 对象
  loadDocument: (document: Document) => void; // [新增] 加载 Document 到扁平 Store
}

// 使用 Immer + 扁平化存储
export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    nodes: {},
    rootId: '',
    documentId: '',
    title: '',

    updateNodeContent: (id, content) => {
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].content = content;
        }
      });
    },

    // [新增] 从扁平数据构建 Document 对象（用于保存和导出）
    buildDocumentTree: (): Document => {
      const state = get();
      const nodesMap = state.nodes;
      const rootNode = nodesMap[state.rootId];

      if (!rootNode) {
        throw new Error('Root node not found');
      }

      // 递归构建树
      const buildNode = (nodeId: string): OutlineNode => {
        const storedNode = nodesMap[nodeId];
        return {
          ...storedNode,
          // [关键] 将 children 的 ID 数组转换为真实的节点对象数组
          children: storedNode.children.map(buildNode),
        } as OutlineNode;
      };

      return {
        id: state.documentId,
        title: state.title,
        root: buildNode(state.rootId),
        metadata: {
          createdAt: rootNode.createdAt,
          updatedAt: rootNode.updatedAt,
          version: '1.0.0',
        },
      };
    },

    // [新增] 加载 Document 到扁平 Store（用于导入）
    loadDocument: (document: Document) => {
      set(state => {
        state.documentId = document.id;
        state.title = document.title;
        state.rootId = document.root.id;

        const nodesMap: Record<string, StoredOutlineNode> = {};

        // 递归扁平化树
        const flattenNode = (node: OutlineNode, parentId: string | null = null) => {
          const childrenIds = node.children.map(child => child.id);

          nodesMap[node.id] = {
            ...node,
            parentId,
            // [关键] children 存储 ID 数组
            children: childrenIds,
          } as StoredOutlineNode;

          // 递归处理子节点
          node.children.forEach(child => flattenNode(child, node.id));
        };

        flattenNode(document.root, null);
        state.nodes = nodesMap;
      });
    },

    // ...其他 actions
  }))
);
```

**React.memo 优化**
```typescript
// components/editor/OutlineNode.tsx
import { memo } from 'react';
import { useEditorStore } from '@/lib/store';

// 使用 React.memo 包裹，避免不必要的重渲染
export const OutlineNode = memo(function OutlineNode({
  nodeId,
  depth
}: OutlineNodeProps) {
  // 使用 Selector 只订阅需要的数据
  const node = useEditorStore(state => state.nodes[nodeId]);
  const updateContent = useEditorStore(state => state.updateNodeContent);

  return (
    <div className="flex" style={{ marginLeft: depth * 24 }}>
      <NodeToggle nodeId={nodeId} />
      <input
        value={node.content}
        onChange={(e) => updateContent(nodeId, e.target.value)}
        className="border-none bg-transparent"
      />
      <NodeImages images={node.images} />
    </div>
  );
});
```

#### 1.3 折叠/展开交互
- 点击专门的箭头图标控制（不影响文本编辑）
- 使用箭头图标：▶ / ▼
- 折叠状态保存在 `node.collapsed` 字段

---

### 2. AI 智能重组（核心功能）

#### 2.1 功能定位

**重点在于分类和层级整理**，而非简单排序：
- 识别内容主题
- 创建父级分类节点
- 将相关内容归类
- 建立合理的层级关系

**示例：**
```
原始混乱结构：
如何学习编程
Python 基础
变量
数据类型
JavaScript
ES6 新特性
箭头函数

AI 整理后：
编程学习
├─ Python
│  ├─ 变量
│  └─ 数据类型
└─ JavaScript
   └─ ES6 新特性
      └─ 箭头函数
```

#### 2.2 实现流程

```
用户点击"AI 整理"
     ↓
1. 提取纯文本结构（去除 ID、时间戳等）
     ↓
2. 调用 generateObject（Zod 保证类型安全）
     ↓
3. AI 返回 newStructure（无 ID 的树）
     ↓
4. 前端生成新的 UUID，构建完整树
     ↓
5. 前端算法计算 Diff（changes 列表）
     ↓
6. 展示预览 + 确认应用
```

#### 2.3 Zod Schema 定义

```typescript
// lib/ai-schema.ts
import { z } from 'zod';

// 定义 AI 需要返回的节点结构（不需要 ID，只需要内容）
export const AIOutlineNodeSchema = z.object({
  content: z.string(),
  children: z.array(z.lazy(() => AIOutlineNodeSchema)),
});

export const ReorganizeResultSchema = z.object({
  reasoning: z.string(),           // AI 的整理理由
  newStructure: AIOutlineNodeSchema, // 整理后的完整树结构（不含 ID）
});
```

#### 2.4 Server Action 实现

```typescript
// app/actions/ai.ts
'use server'
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ReorganizeResultSchema } from '@/lib/ai-schema';

export async function reorganizeOutline(currentTree: OutlineNode) {
  // 提取纯文本结构发给 AI（减少 Token，也防止泄露 ID）
  const plainTextTree = extractContentFromTree(currentTree);

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ReorganizeResultSchema,
    prompt: `
你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID

原始内容：
${JSON.stringify(plainTextTree)}
    `,
  });

  return result.object; // 直接拿到类型安全的 { reasoning, newStructure }
}
```

#### 2.5 前端 Diff 计算

**⚠️ 算法局限性说明（MVP 阶段可接受）：**

当前 Diff 算法基于"内容文本"匹配，存在以下局限性：

1. **重名冲突**：如果有多个节点内容相同（如两个"第一章"），算法可能混淆
2. **改名无法识别**：AI 将"介绍"改为"简介"时，会被判定为"删除旧节点 + 新建节点"，而非"重命名"
3. **解决方案**：
   - 在 Prompt 中明确要求 AI 尽量保留原始文本，避免重命名
   - 在 UI 的 PlanPreview 中，对于判定为 `create` 的节点，不要显示红色警告
   - 给用户适当的心理预期（可能是改名或合并操作）

**未来优化方向**（V2+）：
- 使用向量相似度匹配内容，而非精确字符串匹配
- AI 在返回结果时包含"原始 ID 映射"（需要修改 Prompt 输出格式）

```typescript
// utils/tree-diff.ts
import { OutlineNode, ReorganizeChange } from '@/types';

export function calculateDiff(
  oldTree: OutlineNode,
  newTree: OutlineNode
): ReorganizeChange[] {
  const changes: ReorganizeChange[] = [];

  // 遍历新树，查找每个节点的来源
  function traverse(newNode: OutlineNode, path: string[]) {
    const oldLocation = findNodeInTree(oldTree, newNode.content);

    if (oldLocation) {
      // 节点存在但路径变了 → 移动操作
      if (oldLocation.path.join('/') !== path.join('/')) {
        changes.push({
          type: 'move',
          description: `从 "${oldLocation.path.join('/')}" 移动到此`,
          fromPath: oldLocation.path,
          toPath: path,
        });
      }
    } else {
      // 节点不存在 → 新建分类（可能是改名或合并）
      changes.push({
        type: 'create_category',
        description: '新建分类',
        fromPath: [],
        toPath: path,
      });
    }

    newNode.children.forEach(child =>
      traverse(child, [...path, newNode.content])
    );
  }

  traverse(newTree, [newTree.content]);
  return changes;
}
```

#### 2.6 组件实现

```typescript
// components/ai/AIReorganizeModal.tsx
'use client'
import { useState } from 'react';
import { reorganizeOutline } from '@/app/actions';
import { calculateDiff } from '@/utils/tree-diff';
import { OutlineNode } from '@/types';

export function AIReorganizeModal({ document }: { document: Document }) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    newTree: OutlineNode;
    changes: ReorganizeChange[];
  } | null>(null);

  const handleReorganize = async () => {
    setIsLoading(true);
    try {
      const aiResult = await reorganizeOutline(document.root);

      // 1. 将 AI 返回的无 ID 结构转化为带 ID 的 OutlineNode
      const newTreeWithIds = buildTreeWithIds(aiResult.newStructure);

      // 2. 计算差异
      const changes = calculateDiff(document.root, newTreeWithIds);

      setPreviewData({ newTree: newTreeWithIds, changes });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal>
      {isLoading && <div>AI 正在思考分类策略...</div>}
      {previewData && (
        <PlanPreview
          originalTree={document.root}
          newTree={previewData.newTree}
          changes={previewData.changes}
        />
      )}
      <button onClick={handleReorganize}>开始整理</button>
    </Modal>
  );
}
```

#### 2.7 UI 设计（并排视图）

```
┌─────────────────────────────────────────────────────┐
│  AI 重组预览                                          │
├─────────────────────┬───────────────────────────────┤
│  原始结构            │  重组后结构                     │
│  ├─ 第一章           │  ├─ 第一章 ✅                   │
│  │  └─ 1.1           │  │  ├─ 1.1 (从 1.2 移动) 🔄    │
│  │     └─ 内容       │  │  └─ 1.2 (重命名为 小节) ✏️ │
│  │  └─ 1.2           │  └─ 第二章                     │
│  └─ 第二章           │                               │
├─────────────────────┴───────────────────────────────┤
│  AI 说明：检测到 1.1 和 1.2 顺序有误，已调整逻辑顺序  │
├─────────────────────────────────────────────────────┤
│            [取消]              [确认应用]             │
└─────────────────────────────────────────────────────┘
```

---

### 3. 图床上传功能

#### 3.1 完整的图床配置系统

**核心设计原则：**
- 通过后端代理统一上传入口，图床切换对组件透明
- 适配不同图床的表单字段名和响应结构差异
- 完整的文件校验（类型、大小限制）
- 统一的错误处理和格式

**图床元信息配置：**
```typescript
// lib/image-upload.ts
export type ImageProvider = 'imgur' | 'smms' | 'custom';

export interface ImageUploadConfig {
  provider: ImageProvider;
  apiKey: string;
  customUrl?: string;
}

// 图床元信息：上传地址、认证头、表单字段名、响应解析函数
export const IMAGE_PROVIDERS: Record<
  ImageProvider,
  {
    name: string;
    uploadUrl: string | ((config: ImageUploadConfig) => string);
    headers: (config: ImageUploadConfig) => Record<string, string>;
    formFieldName: string;
    parseResponse: (data: unknown) => { url: string } | null;
  }
> = {
  imgur: {
    name: 'Imgur',
    uploadUrl: 'https://api.imgur.com/3/image',
    headers: (cfg) => ({ Authorization: `Client-ID ${cfg.apiKey}` }),
    formFieldName: 'image', // Imgur 使用 'image' 而非 'file'
    parseResponse: (data: unknown) => {
      const d = data as { data?: { link?: string } } | undefined;
      if (d?.data?.link) return { url: d.data.link };
      return null;
    },
  },
  smms: {
    name: 'SM.MS',
    uploadUrl: 'https://sm.ms/api/v2/upload',
    headers: (cfg) => ({ Authorization: cfg.apiKey }),
    formFieldName: 'smfile', // SM.MS 使用 'smfile'
    parseResponse: (data: unknown) => {
      const d = data as
        | { success?: boolean; data?: { url?: string } }
        | undefined;
      if (d?.success && d.data?.url) return { url: d.data.url };
      return null;
    },
  },
  custom: {
    name: '自定义',
    uploadUrl: (cfg) => cfg.customUrl || '',
    headers: (cfg) => ({ 'X-API-Key': cfg.apiKey }),
    formFieldName: 'file', // 常见约定
    parseResponse: (data: unknown) => {
      // 假设自定义图床统一响应为 { url: string }
      const d = data as { url?: string } | undefined;
      if (d?.url) return { url: d.url };
      return null;
    },
  },
};
```

#### 3.2 后端代理上传（完整实现）

**关键优化：**
- 文件类型和大小校验
- 统一的错误处理格式
- 配置从请求 Header 获取（避免服务端读 localStorage）
- 完整的日志记录

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_PROVIDERS, ImageUploadConfig, ImageProvider } from '@/lib/image-upload';

// 从 header 获取配置（前端传递）
function getConfigFromRequest(req: NextRequest): ImageUploadConfig {
  const provider = (req.headers.get('x-image-provider') || 'imgur') as ImageProvider;
  const apiKey = req.headers.get('x-image-api-key') || '';
  const customUrl = req.headers.get('x-image-custom-url') || undefined;
  return { provider, apiKey, customUrl };
}

// 文件校验
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = /^image\/(png|jpeg|jpg|gif|webp)$/;

function validateFile(file: File) {
  if (!ALLOWED_TYPES.test(file.type)) {
    throw new Error('Unsupported image type');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5 MB limit');
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: '未选择文件' } },
        { status: 400 }
      );
    }

    validateFile(file);

    const config = getConfigFromRequest(req);
    const providerInfo = IMAGE_PROVIDERS[config.provider];

    const uploadUrl =
      typeof providerInfo.uploadUrl === 'function'
        ? providerInfo.uploadUrl(config)
        : providerInfo.uploadUrl;

    // 构造发给第三方图床的 formData
    const upstreamFormData = new FormData();
    upstreamFormData.append(providerInfo.formFieldName, file);

    const upstreamRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: providerInfo.headers(config),
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => '');
      console.error('[upload] upstream error', upstreamRes.status, text);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPSTREAM_ERROR',
            message: `图床返回错误：${upstreamRes.status}`,
            details: text,
          },
        },
        { status: upstreamRes.status }
      );
    }

    const upstreamData = await upstreamRes.json();
    const parsed = providerInfo.parseResponse(upstreamData);

    if (!parsed?.url) {
      console.error('[upload] 无法解析图片 URL', upstreamData);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: '图床返回数据格式不符合预期',
            details: upstreamData,
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, url: parsed.url });
  } catch (err: any) {
    console.error('[upload] unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}
```

#### 3.3 前端调用示例

```typescript
// components/ImageUploader.tsx
'use client';

import { useRef, useState } from 'react';

type ImageProvider = 'imgur' | 'smms' | 'custom';

export function ImageUploader({
  provider,
  apiKey,
  customUrl,
  onUploaded,
}: {
  provider: ImageProvider;
  apiKey: string;
  customUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {
      'x-image-provider': provider,
      'x-image-api-key': apiKey,
    };
    if (customUrl) headers['x-image-custom-url'] = customUrl;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || '上传失败');
      }

      onUploaded(result.url);
    } catch (err: any) {
      setError(err?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={handleFileChange}
      />
      {uploading && <span>上传中...</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
}
```

#### 3.4 图片插入交互（类似幕布）

**插入方式：**
1. 菜单栏「添加图片」按钮
2. 快捷键 `Alt + Enter`（Mac: `Option + Enter`）
3. 直接拖拽图片到编辑器
4. 复制粘贴图片

**显示方式：**
- 图片直接显示在大纲内容中
- 可拖动调整大小（等比缩放）
- 支持缩略图 + 点击放大预览

#### 3.5 设置界面

**配置持久化：**
- 配置保存在 localStorage（客户端）
- 设置界面只维护配置对象（provider / apiKey / customUrl）
- 上传时从配置读取并传递给 ImageUploader
- 避免在设置组件里耦合上传逻辑

---

## 数据持久化设计

### 1. 数据库设计（IndexedDB + Dexie.js）

**关键修正：**
- configs 表的 key 是 string 类型主键，不要用 `++`
- 使用泛型指定主键类型：`Table<ConfigDocument, string>`

```typescript
// lib/db.ts
import Dexie, { Table } from 'dexie';

// 定义数据库表结构
interface OutlineNodeDocument {
  id?: number; // IndexedDB 自增主键（内部使用）
  documentId: string; // 文档 ID（业务 ID）
  data: Document; // 完整的文档数据
  createdAt: number;
  updatedAt: number;
}

interface ConfigDocument {
  key: string; // 主键：配置名（如 'user-config'）
  value: any;  // 配置值
  updatedAt: number;
}

class OutlineDatabase extends Dexie {
  documents!: Table<OutlineNodeDocument, number>;
  configs!: Table<ConfigDocument, string>; // 泛型第二个参数指定主键类型为 string

  constructor() {
    super('OutlineEditorDB');
    this.version(1).stores({
      // documentId 是索引，用于快速查询
      documents: '++id, documentId, createdAt, updatedAt',
      // key 是主键（string 类型），updatedAt 是索引
      configs: 'key, updatedAt',
    });
  }
}

export const db = new OutlineDatabase();
```

### 2. CRUD 操作封装

```typescript
// lib/db.ts (继续)
export const documentDb = {
  // 保存文档
  async saveDocument(document: Document): Promise<void> {
    const now = Date.now();
    const existing = await db.documents
      .where('documentId')
      .equals(document.id)
      .first();

    if (existing) {
      await db.documents.update(existing.id!, {
        data: document,
        updatedAt: now,
      });
    } else {
      await db.documents.add({
        documentId: document.id,
        data: document,
        createdAt: now,
        updatedAt: now,
      });
    }
  },

  // 加载文档
  async loadDocument(documentId: string): Promise<Document | null> {
    const doc = await db.documents
      .where('documentId')
      .equals(documentId)
      .first();
    return doc?.data || null;
  },

  // 获取所有文档列表
  async listDocuments(): Promise<
    Array<{ id: string; title: string; updatedAt: number }>
  > {
    const docs = await db.documents.toArray();
    return docs.map((doc) => ({
      id: doc.data.id,
      title: doc.data.title,
      updatedAt: doc.data.metadata.updatedAt,
    }));
  },

  // 删除文档
  async deleteDocument(documentId: string): Promise<void> {
    await db.documents
      .where('documentId')
      .equals(documentId)
      .delete();
  },
};

export const configDb = {
  // 保存配置
  async saveConfig(key: string, value: any): Promise<void> {
    const existing = await db.configs.where('key').equals(key).first();
    if (existing) {
      await db.configs.update(existing.id!, { value, updatedAt: Date.now() });
    } else {
      await db.configs.add({ key, value, updatedAt: Date.now() });
    }
  },

  // 加载配置
  async loadConfig<T>(key: string): Promise<T | null> {
    const config = await db.configs.where('key').equals(key).first();
    return config?.value || null;
  },

  // 删除配置
  async deleteConfig(key: string): Promise<void> {
    await db.configs.where('key').equals(key).delete();
  },
};
```

### 3. 自动保存逻辑（优化版）

**关键优化：**
- 防止并发冲突（检查 saving 状态）
- 页面关闭前强制保存（beforeunload 事件）

```typescript
// lib/store.ts (扩展现有的 EditorStore)
interface EditorStore {
  // ... 现有字段

  // 自动保存控制
  autoSaveEnabled: boolean;
  lastSavedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  saveDocument: () => Promise<void>;
  forceSaveNow: () => Promise<void>; // 用于页面关闭前强制保存
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // ... 现有实现

    autoSaveEnabled: true,
    lastSavedAt: null,
    saveStatus: 'idle',

    enableAutoSave: () => set({ autoSaveEnabled: true }),
    disableAutoSave: () => set({ autoSaveEnabled: false }),

    saveDocument: async () => {
      const state = get();

      // 1. 防止并发：如果正在保存，直接跳过
      if (state.saveStatus === 'saving') {
        console.log('Skip save: already saving');
        return;
      }

      // [修正] 检查是否有数据（使用 rootId 而非 document）
      if (!state.rootId || Object.keys(state.nodes).length === 0) {
        console.warn('No data to save');
        return;
      }

      set({ saveStatus: 'saving' });

      try {
        // [修正] 从扁平数据构建 Document 对象
        const documentToSave = get().buildDocumentTree();
        await documentDb.saveDocument(documentToSave);

        set({
          lastSavedAt: Date.now(),
          saveStatus: 'saved',
        });

        // 2秒后重置状态
        setTimeout(() => {
          if (get().saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 2000);
      } catch (error) {
        console.error('Save failed:', error);
        set({ saveStatus: 'error' });
      }
    },

    // 强制保存（用于页面关闭前）
    forceSaveNow: async () => {
      await get().saveDocument();
    },
  }))
);

// 自动保存 hook
export function useAutoSave(interval: number = 3000) {
  const saveDocument = useEditorStore((state) => state.saveDocument);
  const forceSaveNow = useEditorStore((state) => state.forceSaveNow);
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    // 定时保存
    const timer = setInterval(() => {
      saveDocument();
    }, interval);

    // 页面关闭/刷新前保存
    const handleBeforeUnload = () => {
      forceSaveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveDocument, forceSaveNow, autoSaveEnabled, interval]);
}
```

### 4. JSON 导入/导出（带 Zod 校验）

**安全性优化：**
- 使用 Zod 进行运行时数据校验
- 详细的错误提示

```typescript
// utils/import-export.ts
import { Document } from '@/types';
import { z } from 'zod';

// 定义文档的 Zod Schema
const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  root: z.any(), // 实际项目中应该定义完整的 OutlineNode Schema
  metadata: z.object({
    createdAt: z.number(),
    updatedAt: z.number(),
    version: z.string(),
  }),
});

// 导出为 JSON
export function exportToJSON(document: Document): string {
  return JSON.stringify(document, null, 2);
}

// 触发下载
export function downloadJSON(document: Document, filename?: string): void {
  const json = exportToJSON(document);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${document.title}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 从 JSON 导入（带 Zod 校验）
export function importFromJSON(jsonString: string): Document {
  try {
    const data = JSON.parse(jsonString);

    // 使用 Zod 强校验
    const result = DocumentSchema.safeParse(data);

    if (!result.success) {
      console.error('Validation error:', result.error);
      throw new Error('文件格式不正确，可能是版本过旧或文件已损坏');
    }

    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON 解析失败：语法错误');
    }
    throw error;
  }
}

// 从文件导入
export async function importFromFile(file: File): Promise<Document> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const document = importFromJSON(json);
        resolve(document);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
```

**性能说明：**
- MVP 阶段使用全量保存（每次保存整个 Document）
- 适合几百个节点的文档
- 如果节点数超过 1000，未来可考虑增量更新优化

---

## 工具栏与设置界面设计

### 1. 工具栏组件

**状态管理优化：**
- Modal 状态（showAIModal、showSettings）放在 EditorStore 中
- 便于其他组件控制弹窗（如 AI 重组完成后自动关闭）

```typescript
// components/Toolbar.tsx
'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { useDocumentIO } from '@/hooks/useDocumentIO';
import { SaveStatus } from './SaveStatus';
import { ToolbarButton } from './ToolbarButton';

export function Toolbar() {
  const { handleImport, handleExport } = useDocumentIO();
  const showAIModal = useEditorStore((s) => s.showAIModal);
  const showSettings = useEditorStore((s) => s.showSettings);
  const setShowAIModal = useEditorStore((s) => s.setShowAIModal);
  const setShowSettings = useEditorStore((s) => s.setShowSettings);

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {/* 左侧：文件操作 */}
        <ToolbarButton
          icon="📥"
          label="导入"
          onClick={() => document.getElementById('import-input')?.click()}
        />
        <input
          id="import-input"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />

        <ToolbarButton
          icon="📤"
          label="导出"
          onClick={handleExport}
        />

        <div className="mx-2 h-6 w-px bg-gray-300" />

        {/* 核心功能：AI 整理 */}
        <ToolbarButton
          icon="✨"
          label="AI 整理"
          onClick={() => setShowAIModal(true)}
          primary
        />
      </div>

      <div className="flex items-center gap-4">
        {/* 保存状态指示 */}
        <SaveStatus />

        {/* 右侧：设置 */}
        <ToolbarButton
          icon="⚙️"
          label="设置"
          onClick={() => setShowSettings(true)}
        />
      </div>

      {/* Modals */}
      {showAIModal && <AIReorganizeModal onClose={() => setShowAIModal(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
```

### 2. 文档导入/导出 Hook

**职责分离：**
- Toolbar 只负责 UI
- 业务逻辑抽离到 useDocumentIO hook

```typescript
// hooks/useDocumentIO.ts
import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { importFromFile, downloadJSON } from '@/utils/import-export';

export function useDocumentIO() {
  const loadDocument = useEditorStore((s) => s.loadDocument);
  const document = useEditorStore((s) => s.document);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const doc = await importFromFile(file);
        loadDocument(doc);
        toast.success('导入成功');
      } catch (e) {
        toast.error('导入失败：' + (e as Error).message);
      }
    },
    [loadDocument]
  );

  const handleExport = useCallback(() => {
    if (!document) {
      toast.error('没有可导出的文档');
      return;
    }
    downloadJSON(document);
    toast.success('导出成功');
  }, [document]);

  return { handleImport, handleExport };
}
```

### 3. 设置界面（优化版）

**关键优化：**
- hasChanges 自动检测（对比 initialConfig）
- API Key 显示/隐藏切换

```typescript
// components/SettingsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { configDb } from '@/lib/db';
import { UserConfig } from '@/types';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<UserConfig>({
    aiProvider: 'openai',
    apiKeys: {},
    imageUpload: {
      provider: 'imgur',
      apiKey: '',
      customUrl: '',
    },
  });
  const [initialConfig, setInitialConfig] = useState<UserConfig>(config);
  const [showKeys, setShowKeys] = useState(false);

  // 加载配置
  useEffect(() => {
    configDb.loadConfig<UserConfig>('user-config').then((savedConfig) => {
      if (savedConfig) {
        setConfig(savedConfig);
        setInitialConfig(savedConfig);
      }
    });
  }, []);

  // 自动检测变更
  const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

  const handleSave = async () => {
    await configDb.saveConfig('user-config', config);
    onClose();
    toast.success('设置已保存');
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6 p-6">
        <h2 className="text-xl font-semibold">设置</h2>

        {/* AI 配置 */}
        <section>
          <h3 className="text-lg font-medium mb-3">AI 服务</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                AI 提供商
              </label>
              <select
                value={config.aiProvider}
                onChange={(e) =>
                  setConfig({ ...config, aiProvider: e.target.value as any })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={config.apiKeys[config.aiProvider] || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      apiKeys: {
                        ...config.apiKeys,
                        [config.aiProvider]: e.target.value,
                      },
                    })
                  }
                  placeholder="输入你的 API Key"
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                >
                  {showKeys ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* 图床配置 */}
        <section>
          <h3 className="text-lg font-medium mb-3">图床上传</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                图床服务
              </label>
              <select
                value={config.imageUpload.provider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    imageUpload: {
                      ...config.imageUpload,
                      provider: e.target.value as any,
                    },
                  })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="imgur">Imgur</option>
                <option value="smms">SM.MS</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={config.imageUpload.apiKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      imageUpload: {
                        ...config.imageUpload,
                        apiKey: e.target.value,
                      },
                    })
                  }
                  placeholder="输入图床 API Key"
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                >
                  {showKeys ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {config.imageUpload.provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  自定义 API 地址
                </label>
                <input
                  type="url"
                  value={config.imageUpload.customUrl || ''}
                  onChange={(e) => {
                    let url = e.target.value;
                    // [优化] 自动补全 https://，防止 Mixed Content 警告
                    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                      url = 'https://' + url;
                    }
                    setConfig({
                      ...config,
                      imageUpload: {
                        ...config.imageUpload,
                        customUrl: url,
                      },
                    });
                  }}
                  placeholder="https://your-image-host.com/api/upload"
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  提示：URL 会自动补全 https:// 前缀
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 文档列表管理（MVP 阶段）

### 设计说明

**MVP 阶段：平铺所有文档**

- 所有文档展示在侧边栏列表中（类似幕布的"我的桌面"）
- 支持通过标题或创建时间排序
- 点击文档卡片切换到对应文档
- 暂不支持文件夹嵌套功能（后续迭代）

### 数据流设计

```
用户打开应用 → 前端触发 fetchDocuments → 调用后端 /api/documents
→ 后端从 Dexie 获取数据 → 前端更新 store → 组件渲染文档列表
```

### 后端实现

```typescript
// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { documentDb } from '@/lib/db';

export async function GET() {
  try {
    const documents = await documentDb.listDocuments();
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
```

### 前端 Store 扩展

```typescript
// lib/store.ts (添加到 EditorStore)
interface EditorStore {
  // 文档列表
  documents: Array<{ id: string; title: string; updatedAt: number }>;
  isLoadingDocuments: boolean;
  fetchDocuments: () => Promise<void>;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // ... 现有实现

    documents: [],
    isLoadingDocuments: false,

    fetchDocuments: async () => {
      set({ isLoadingDocuments: true });
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (data.success) {
          set({ documents: data.data });
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        set({ isLoadingDocuments: false });
      }
    },
  }))
);
```

### 前端组件使用

```typescript
// components/DocumentList.tsx
'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export function DocumentList() {
  const documents = useEditorStore((s) => s.documents);
  const isLoadingDocuments = useEditorStore((s) => s.isLoadingDocuments);
  const fetchDocuments = useEditorStore((s) => s.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoadingDocuments) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
          onClick={() => {/* 切换到该文档 */}}
        >
          <div className="font-medium">{doc.title}</div>
          <div className="text-sm text-gray-500">
            {new Date(doc.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 后续迭代方向

**V2+ 可扩展文件夹功能：**
- 新增 Folder 实体（id、name、children）
- 支持文件夹展开/折叠 UI
- 支持拖拽排序和右键菜单
- 数据模型添加 folderId 字段

当前架构已预留扩展性，无需大规模重构。

---

## 撤销/重做与快捷键设计

### 1. 历史栈管理

**核心设计：**
- 简单的时间戳快照模式
- 限制历史栈大小（默认 30 步）
- 支持批量操作（如 AI 重组）

```typescript
// lib/store.ts (扩展 EditorStore)
interface EditorStore {
  // ... 现有字段

  // 历史栈
  history: {
    past: Document[];
    present: Document | null;
    future: Document[];
  };

  // Actions
  undo: () => void;
  redo: () => void;
  pushHistory: (document: Document) => void;
  clearHistory: () => void;

  // 辅助
  canUndo: boolean;
  canRedo: boolean;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // ... 现有实现

    history: {
      past: [],
      present: null,
      future: [],
    },

    canUndo: false,
    canRedo: false,

    pushHistory: (document) => {
      set((state) => {
        // 限制历史栈大小
        const MAX_HISTORY = 30;

        // 深拷贝当前文档作为快照
        const snapshot = JSON.parse(JSON.stringify(document));

        // 如果有 present，移入 past
        if (state.history.present) {
          state.history.past.push(state.history.present);
        }

        // 设置新的 present
        state.history.present = snapshot;

        // 清空 future（新的操作分支）
        state.history.future = [];

        // 限制 past 大小
        if (state.history.past.length > MAX_HISTORY) {
          state.history.past.shift();
        }

        // 更新 canUndo/canRedo
        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;
      });
    },

    undo: () => {
      set((state) => {
        const { past, present, future } = state.history;

        if (past.length === 0 || !present) return;

        // present 移入 future
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        state.history = {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };

        state.canUndo = newPast.length > 0;
        state.canRedo = true;

        // 同步到 document
        state.document = previous;
      });
    },

    redo: () => {
      set((state) => {
        const { past, present, future } = state.history;

        if (future.length === 0) return;

        // future 的第一个移入 present
        const next = future[0];
        const newFuture = future.slice(1);

        state.history = {
          past: [...past, present!],
          present: next,
          future: newFuture,
        };

        state.canUndo = true;
        state.canRedo = newFuture.length > 0;

        // 同步到 document
        state.document = next;
      });
    },

    clearHistory: () => {
      set((state) => {
        state.history = {
          past: [],
          present: state.document,
          future: [],
        };
        state.canUndo = false;
        state.canRedo = false;
      });
    },
  }))
);
```

### 2. 自动记录历史

**触发时机：**
- 编辑节点内容后（防抖）
- 应用 AI 重组计划后
- 导入文档后
- 手动保存后（可选）

```typescript
// hooks/useAutoHistory.ts
import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { debounce } from 'lodash';

export function useAutoHistory() {
  const document = useEditorStore((s) => s.document);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  // 防抖：用户停止输入 500ms 后才记录历史
  const debouncedPushHistory = debounce(
    (doc) => {
      if (doc) pushHistory(doc);
    },
    500,
    { trailing: true }
  );

  useEffect(() => {
    if (document) {
      debouncedPushHistory(document);
    }
  }, [document, debouncedPushHistory]);
}
```

### 3. 快捷键支持

**核心快捷键：**
- `Ctrl/Cmd + Z`: 撤销
- `Ctrl/Cmd + Shift + Z` 或 `Ctrl/Cmd + Y`: 重做
- `Ctrl/Cmd + S`: 手动保存
- `Ctrl/Cmd + N`: 新建文档
- `Alt + Enter`: 插入图片

```typescript
// hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const saveDocument = useEditorStore((s) => s.saveDocument);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl/Cmd + Shift + Z: 重做
            if (canRedo) redo();
          } else {
            // Ctrl/Cmd + Z: 撤销
            if (canUndo) undo();
          }
          break;

        case 'y':
          // Ctrl/Cmd + Y: 重做（Windows 风格）
          e.preventDefault();
          if (canRedo) redo();
          break;

        case 's':
          // Ctrl/Cmd + S: 保存
          e.preventDefault();
          saveDocument();
          break;

        case 'n':
          // Ctrl/Cmd + N: 新建文档
          e.preventDefault();
          // TODO: 实现新建文档逻辑
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveDocument, canUndo, canRedo]);
}
```

### 4. 工具栏中的撤销/重做按钮

```typescript
// components/Toolbar.tsx (添加)
import { useEditorStore } from '@/lib/store';

export function Toolbar() {
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      {/* ... 现有内容 */}

      <div className="flex items-center gap-2">
        {/* 撤销/重做按钮 */}
        <ToolbarButton
          icon="↩️"
          label="撤销"
          onClick={undo}
          disabled={!canUndo}
          shortcut="⌘Z"
        />

        <ToolbarButton
          icon="↪️"
          label="重做"
          onClick={redo}
          disabled={!canRedo}
          shortcut="⌘⇧Z"
        />

        {/* ... 其他按钮 */}
      </div>
    </div>
  );
}
```

---

## 待完成的设计

### 5. 次要功能（后续迭代）
- [ ] 搜索功能（低优先级，节点 > 100 时再考虑）
- [ ] 更多快捷键（拖拽、格式化等）

---

## 关键技术决策

### ✅ 已确定的优化

1. **数据模型优化**
   - 添加 `parentId` 字段提升查找性能
   - `ReorganizeChange` 使用 ID 路径而非内容路径
   - `ImageAttachment` 增加 `alt` 和 `caption` 字段

2. **性能优化**
   - 扁平化 Store 存储（`Record<string, OutlineNode>`）
   - React.memo + Zustand Selector 避免全量重渲染
   - 使用 `<input>` 代替 `contenteditable`

3. **AI 功能优化**
   - AI 只返回结构，不负责计算差异
   - 使用 `generateObject` + `Zod` 保证类型安全
   - 前端算法计算 Diff

4. **架构优化**
   - Next.js 全栈一体化（前端 + API Routes + Server Actions）
   - 按功能分组的组件结构

5. **数据持久化优化**
   - 修正 Dexie 表结构定义（configs 表主键为 string）
   - 防止自动保存并发冲突
   - 页面关闭前强制保存（beforeunload）
   - 使用 Zod 校验导入的 JSON

6. **图床上传优化**
   - 适配不同图床的表单字段和响应结构
   - 统一的错误处理格式
   - 完整的文件校验（类型、大小）

7. **UI/UX 优化**
   - Modal 状态集中在 EditorStore 管理
   - 导入/导出逻辑抽离为 useDocumentIO hook
   - 设置界面自动检测变更（hasChanges）
   - API Key 输入支持显示/隐藏切换

8. **核心体验优化**
   - 撤销/重做功能（历史栈 + 快捷键）
   - 自动记录历史（防抖）
   - 常用快捷键支持

---

## 开发优先级

### Phase 1: MVP 核心
1. 基础数据结构 + Zustand Store
2. 大纲编辑器（增删改查、折叠/展开）
3. IndexedDB 本地存储
4. JSON 导入/导出
5. 工具栏 + 设置界面
6. **撤销/重做（核心体验）**

### Phase 2: AI 功能
1. AI Schema 定义
2. Server Action 实现
3. 前端 Diff 算法
4. 重组预览 UI

### Phase 3: 图片功能
1. 图床配置界面
2. 图片上传代理
3. 图片插入和显示

### Phase 4: 优化迭代
1. 完整快捷键支持
2. 性能优化
3. 搜索功能（根据用户反馈决定）

---

*文档生成时间: 2026-02-08*


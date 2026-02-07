# AI 智能大纲编辑器实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个类似幕布的 AI 智能大纲整理工具，支持无限层级、AI 自动分类、图片插入、撤销重做。

**Architecture:** Next.js 14+ 全栈应用，前端使用 Zustand + Immer 管理扁平化状态，IndexedDB (Dexie.js) 本地持久化，Vercel AI SDK 接入多个 AI 提供商实现智能重组。

**Tech Stack:** Next.js 14, TypeScript, Zustand, Immer, Dexie.js, Vercel AI SDK, Zod, Tailwind CSS, shadcn/ui

---

## Phase 0: 项目初始化

### Task 0.1: 创建 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`

**Step 1: 初始化 Next.js 项目**

运行：`npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`

预期输出：
```
✔ Would you like to use App Router? (recommended) … Yes
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use Tailwind CSS? … Yes
```

**Step 2: 安装核心依赖**

运行：
```bash
npm install zustand immer dexie ai zod @ai-sdk/openai
npm install -D @types/node
```

预期输出：依赖安装成功，无错误

**Step 3: 验证项目结构**

运行：`ls -la`

预期输出：
```
app/
components/
lib/
public/
package.json
next.config.js
tailwind.config.ts
tsconfig.json
```

**Step 4: 启动开发服务器验证**

运行：`npm run dev`

预期：浏览器访问 http://localhost:3000 显示 Next.js 欢迎页

**Step 5: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 0.2: 创建目录结构

**Files:**
- Create: `components/editor/`
- Create: `components/ai/`
- Create: `components/ui/`
- Create: `lib/`
- Create: `types/`
- Create: `utils/`
- Create: `app/actions/`
- Create: `app/api/`

**Step 1: 创建目录**

运行：
```bash
mkdir -p components/editor components/ai components/ui lib types utils app/actions app/api/ai app/api/upload
```

预期：所有目录创建成功

**Step 2: 创建基础类型定义**

创建文件：`types/index.ts`

```typescript
// 存储层：扁平化节点（children 存储 ID 数组）
export interface StoredOutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: string[]; // 关键：存储 ID 数组
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

// 渲染层：树形节点（children 是对象数组）
export interface OutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: OutlineNode[];
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImageAttachment {
  id: string;
  url: string;
  thumbnail?: string;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
  uploadedAt: number;
}

export interface Document {
  id: string;
  title: string;
  root: OutlineNode;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

export interface ReorganizeChange {
  type: 'move' | 'rename' | 'merge' | 'split' | 'create_category';
  description: string;
  fromPath: string[];
  toPath: string[];
}

export interface ReorganizePlan {
  originalStructure: OutlineNode;
  proposedStructure: OutlineNode;
  changes: ReorganizeChange[];
  reasoning: string;
}
```

**Step 3: 创建 ID 生成工具**

创建文件：`utils/id.ts`

```typescript
export const generateId = () => crypto.randomUUID();
```

**Step 4: 验证 TypeScript 编译**

运行：`npx tsc --noEmit`

预期：无类型错误

**Step 5: Commit**

```bash
git add types/ utils/
git commit -m "feat: add type definitions and id generator"
```

---

## Phase 1: 基础数据层

### Task 1.1: 实现 Zustand Store（扁平化存储）

**Files:**
- Create: `lib/store.ts`

**Step 1: 创建基础 Store 结构**

创建文件：`lib/store.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StoredOutlineNode, OutlineNode, Document } from '@/types';

interface EditorStore {
  // 扁平化存储
  nodes: Record<string, StoredOutlineNode>;
  rootId: string;
  documentId: string;
  title: string;

  // 自动保存控制
  autoSaveEnabled: boolean;
  lastSavedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  updateNodeContent: (id: string, content: string) => void;
  buildDocumentTree: () => Document;
  loadDocument: (document: Document) => void;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    nodes: {},
    rootId: '',
    documentId: '',
    title: '',
    autoSaveEnabled: true,
    lastSavedAt: null,
    saveStatus: 'idle',

    updateNodeContent: (id, content) => {
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].content = content;
        }
      });
    },

    buildDocumentTree: (): Document => {
      const state = get();
      const nodesMap = state.nodes;
      const rootNode = nodesMap[state.rootId];

      if (!rootNode) {
        throw new Error('Root node not found');
      }

      const buildNode = (nodeId: string): OutlineNode => {
        const storedNode = nodesMap[nodeId];
        return {
          ...storedNode,
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

    loadDocument: (document) => {
      set(state => {
        state.documentId = document.id;
        state.title = document.title;
        state.rootId = document.root.id;

        const nodesMap: Record<string, StoredOutlineNode> = {};

        const flattenNode = (node: OutlineNode, parentId: string | null = null) => {
          const childrenIds = node.children.map(child => child.id);

          nodesMap[node.id] = {
            ...node,
            parentId,
            children: childrenIds,
          } as StoredOutlineNode;

          node.children.forEach(child => flattenNode(child, node.id));
        };

        flattenNode(document.root, null);
        state.nodes = nodesMap;
      });
    },
  }))
);
```

**Step 2: 验证 Store 编译**

运行：`npx tsc --noEmit`

预期：无类型错误

**Step 3: Commit**

```bash
git add lib/store.ts
git commit -m "feat: implement Zustand store with flat storage"
```

---

### Task 1.2: 实现 IndexedDB (Dexie.js)

**Files:**
- Create: `lib/db.ts`

**Step 1: 创建数据库封装**

创建文件：`lib/db.ts`

```typescript
import Dexie, { Table } from 'dexie';
import { Document } from '@/types';

interface OutlineNodeDocument {
  id?: number;
  documentId: string;
  data: Document;
  createdAt: number;
  updatedAt: number;
}

interface ConfigDocument {
  key: string;
  value: any;
  updatedAt: number;
}

class OutlineDatabase extends Dexie {
  documents!: Table<OutlineNodeDocument, number>;
  configs!: Table<ConfigDocument, string>;

  constructor() {
    super('OutlineEditorDB');
    this.version(1).stores({
      documents: '++id, documentId, createdAt, updatedAt',
      configs: 'key, updatedAt',
    });
  }
}

export const db = new OutlineDatabase();

export const documentDb = {
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

  async loadDocument(documentId: string): Promise<Document | null> {
    const doc = await db.documents
      .where('documentId')
      .equals(documentId)
      .first();
    return doc?.data || null;
  },
};
```

**Step 2: 验证编译**

运行：`npx tsc --noEmit`

预期：无类型错误

**Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: implement IndexedDB with Dexie"
```

---

### Task 1.3: 集成 Store 和 DB（跑通存取）

**Files:**
- Modify: `lib/store.ts`
- Create: `app/page.tsx`

**Step 1: 扩展 Store 添加保存逻辑**

修改文件：`lib/store.ts`

在 `EditorStore` 接口中添加：
```typescript
  saveDocument: () => Promise<void>;
```

在 store 实现中添加：
```typescript
    saveDocument: async () => {
      const state = get();

      if (state.saveStatus === 'saving') {
        console.log('Skip save: already saving');
        return;
      }

      if (!state.rootId || Object.keys(state.nodes).length === 0) {
        console.warn('No data to save');
        return;
      }

      set({ saveStatus: 'saving' });

      try {
        const documentToSave = get().buildDocumentTree();
        const { documentDb } = await import('@/lib/db');
        await documentDb.saveDocument(documentToSave);

        set({
          lastSavedAt: Date.now(),
          saveStatus: 'saved',
        });

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
```

**Step 2: 创建测试页面**

创建文件：`app/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { generateId } from '@/utils/id';

export default function Home() {
  const { nodes, rootId, updateNodeContent, loadDocument, buildDocumentTree } = useEditorStore();

  useEffect(() => {
    // 创建测试文档
    const testDoc = {
      id: generateId(),
      title: '测试文档',
      root: {
        id: generateId(),
        parentId: null,
        content: '根节点',
        level: 0,
        children: [
          {
            id: generateId(),
            parentId: 'root',
            content: '子节点 1',
            level: 1,
            children: [],
            images: [],
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ],
        images: [],
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    };

    loadDocument(testDoc);
  }, [loadDocument]);

  const handleSave = async () => {
    const saved = buildDocumentTree();
    console.log('Saved document:', saved);
    alert('保存成功！查看控制台');
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">大纲编辑器 - 数据层测试</h1>

      <div className="space-y-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          测试保存
        </button>

        <div className="mt-4">
          <h2 className="font-semibold mb-2">节点列表：</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(nodes, null, 2)}
          </pre>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold mb-2">Root ID: {rootId}</h2>
        </div>
      </div>
    </main>
  );
}
```

**Step 3: 启动开发服务器**

运行：`npm run dev`

预期：浏览器访问 http://localhost:3000，点击"测试保存"按钮，控制台输出文档结构

**Step 4: Commit**

```bash
git add lib/store.ts app/page.tsx
git commit -m "feat: integrate store and DB, add test page"
```

**验收标准：**
- ✅ Store 可以正确管理扁平化节点
- ✅ buildDocumentTree() 可以将扁平数据转换为树形结构
- ✅ loadDocument() 可以将树形结构扁平化到 Store
- ✅ 测试页面可以正确显示节点列表

---

## Phase 2: 核心 UI 编辑器

### Task 2.1: 实现大纲节点渲染（递归组件）

**Files:**
- Create: `components/editor/OutlineNode.tsx`
- Create: `components/editor/OutlineTree.tsx`

**Step 1: 创建节点组件**

创建文件：`components/editor/OutlineNode.tsx`

```typescript
'use client';

import { memo } from 'react';
import { useEditorStore } from '@/lib/store';
import { StoredOutlineNode } from '@/types';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore((state) => state.nodes[nodeId]);
  const updateContent = useEditorStore((state) => state.updateNodeContent);

  if (!node) return null;

  return (
    <div className="flex" style={{ marginLeft: depth * 24 }}>
      {/* 折叠/展开箭头 */}
      <button
        className="mr-2 w-6 flex items-center justify-center text-gray-500 hover:text-gray-700"
      >
        {node.children.length > 0 ? (node.collapsed ? '▶' : '▼') : '•'}
      </button>

      {/* 可编辑内容 */}
      <input
        type="text"
        value={node.content}
        onChange={(e) => updateContent(nodeId, e.target.value)}
        className="flex-1 border-none bg-transparent outline-none"
      />

      {/* 图片附件 */}
      {node.images.length > 0 && (
        <span className="ml-2 text-sm text-gray-500">
          📷 {node.images.length}
        </span>
      )}
    </div>
  );
});
```

**Step 2: 创建树组件**

创建文件：`components/editor/OutlineTree.tsx`

```typescript
'use client';

import { useEditorStore } from '@/lib/store';
import { OutlineNode } from './OutlineNode';

export function OutlineTree() {
  const rootId = useEditorStore((state) => state.rootId);
  const nodes = useEditorStore((state) => state.nodes);

  if (!rootId || !nodes[rootId]) {
    return <div>暂无内容</div>;
  }

  // 递归渲染函数
  const renderNode = (nodeId: string, depth: number = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    return (
      <div key={nodeId}>
        <OutlineNode nodeId={nodeId} depth={depth} />
        {node.children.length > 0 && !node.collapsed && (
          <div>
            {node.children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-4">
      {renderNode(rootId)}
    </div>
  );
}
```

**Step 3: 更新主页面**

修改文件：`app/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { generateId } from '@/utils/id';
import { OutlineTree } from '@/components/editor/OutlineTree';

export default function Home() {
  const loadDocument = useEditorStore((state) => state.loadDocument);

  useEffect(() => {
    const testDoc = {
      id: generateId(),
      title: '测试文档',
      root: {
        id: generateId(),
        parentId: null,
        content: '根节点',
        level: 0,
        children: [
          {
            id: generateId(),
            parentId: 'root',
            content: '子节点 1',
            level: 1,
            children: [
              {
                id: generateId(),
                parentId: 'child1',
                content: '孙节点 1',
                level: 2,
                children: [],
                images: [],
                collapsed: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
            ],
            images: [],
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            parentId: 'root',
            content: '子节点 2',
            level: 1,
            children: [],
            images: [],
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ],
        images: [],
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    };

    loadDocument(testDoc);
  }, [loadDocument]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">大纲编辑器</h1>
      <div className="border rounded-lg">
        <OutlineTree />
      </div>
    </main>
  );
}
```

**Step 4: 验证渲染**

运行：`npm run dev`

预期：
- 浏览器显示层级缩进的大纲
- 可以编辑节点内容
- 子节点正确缩进

**Step 5: Commit**

```bash
git add components/ app/page.tsx
git commit -m "feat: implement outline tree renderer"
```

**验收标准：**
- ✅ 节点按层级正确缩进
- ✅ 可以编辑节点内容
- ✅ 编辑后内容正确更新到 Store

---

## Phase 3: AI 重组集成

### Task 3.1: 定义 AI Schema

**Files:**
- Create: `lib/ai-schema.ts`

**Step 1: 创建 Zod Schema**

创建文件：`lib/ai-schema.ts`

```typescript
import { z } from 'zod';

export const AIOutlineNodeSchema = z.object({
  content: z.string(),
  children: z.array(z.lazy(() => AIOutlineNodeSchema)),
});

export const ReorganizeResultSchema = z.object({
  reasoning: z.string(),
  newStructure: AIOutlineNodeSchema,
});
```

**Step 2: 验证编译**

运行：`npx tsc --noEmit`

预期：无类型错误

**Step 3: Commit**

```bash
git add lib/ai-schema.ts
git commit -m "feat: add AI schema definitions with Zod"
```

---

### Task 3.2: 实现 AI Server Action

**Files:**
- Create: `app/actions/ai.ts`
- Create: `app/api/ai/reorganize/route.ts`

**Step 1: 创建 Server Action**

创建文件：`app/actions/ai.ts`

```typescript
'use server'

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ReorganizeResultSchema } from '@/lib/ai-schema';
import { OutlineNode } from '@/types';

export async function reorganizeOutline(currentTree: OutlineNode) {
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

  return result.object;
}

function extractContentFromTree(node: OutlineNode): any {
  return {
    content: node.content,
    children: node.children.map(extractContentFromTree),
  };
}
```

**Step 2: 创建 API Route**

创建文件：`app/api/ai/reorganize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { reorganizeOutline } from '@/app/actions/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await reorganizeOutline(body.currentTree);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI reorganize error:', error);
    return NextResponse.json(
      { error: 'Failed to reorganize outline' },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add app/actions/ app/api/ai/
git commit -m "feat: implement AI reorganize server action"
```

---

### Task 3.3: 实现 Diff 算法

**Files:**
- Create: `utils/tree-diff.ts`

**Step 1: 创建 Diff 算法**

创建文件：`utils/tree-diff.ts`

```typescript
import { OutlineNode, ReorganizeChange } from '@/types';

export function calculateDiff(
  oldTree: OutlineNode,
  newTree: OutlineNode
): ReorganizeChange[] {
  const changes: ReorganizeChange[] = [];

  function traverse(newNode: OutlineNode, path: string[]) {
    const oldLocation = findNodeInTree(oldTree, newNode.content);

    if (oldLocation) {
      if (oldLocation.path.join('/') !== path.join('/')) {
        changes.push({
          type: 'move',
          description: `从 "${oldLocation.path.join('/')}" 移动到此`,
          fromPath: oldLocation.path,
          toPath: path,
        });
      }
    } else {
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

function findNodeInTree(
  tree: OutlineNode,
  content: string
): { path: string[] } | null {
  function search(node: OutlineNode, currentPath: string[]): string[] | null {
    if (node.content === content) {
      return currentPath;
    }
    for (const child of node.children) {
      const result = search(child, [...currentPath, node.content]);
      if (result) return result;
    }
    return null;
  }

  return search(tree, []) ? { path: search(tree, []) || [] } : null;
}
```

**Step 2: Commit**

```bash
git add utils/tree-diff.ts
git commit -m "feat: implement tree diff algorithm"
```

---

## Phase 4: 工具链与打磨

### Task 4.1: 实现图床上传

**Files:**
- Create: `lib/image-upload.ts`
- Create: `app/api/upload/route.ts`

**Step 1: 创建图床配置**

创建文件：`lib/image-upload.ts`

```typescript
export type ImageProvider = 'imgur' | 'smms' | 'custom';

export interface ImageUploadConfig {
  provider: ImageProvider;
  apiKey: string;
  customUrl?: string;
}

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
    formFieldName: 'image',
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
    formFieldName: 'smfile',
    parseResponse: (data: unknown) => {
      const d = data as { success?: boolean; data?: { url?: string } } | undefined;
      if (d?.success && d.data?.url) return { url: d.data.url };
      return null;
    },
  },
  custom: {
    name: '自定义',
    uploadUrl: (cfg) => cfg.customUrl || '',
    headers: (cfg) => ({ 'X-API-Key': cfg.apiKey }),
    formFieldName: 'file',
    parseResponse: (data: unknown) => {
      const d = data as { url?: string } | undefined;
      if (d?.url) return { url: d.url };
      return null;
    },
  },
};
```

**Step 2: 创建上传 API**

创建文件：`app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_PROVIDERS } from '@/lib/image-upload';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

    const provider = (req.headers.get('x-image-provider') || 'imgur') as 'imgur' | 'smms' | 'custom';
    const apiKey = req.headers.get('x-image-api-key') || '';
    const customUrl = req.headers.get('x-image-custom-url') || undefined;

    const providerInfo = IMAGE_PROVIDERS[provider];
    const uploadUrl = typeof providerInfo.uploadUrl === 'function'
      ? providerInfo.uploadUrl({ provider, apiKey, customUrl })
      : providerInfo.uploadUrl;

    const upstreamFormData = new FormData();
    upstreamFormData.append(providerInfo.formFieldName, file);

    const upstreamRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: providerInfo.headers({ provider, apiKey, customUrl }),
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'UPSTREAM_ERROR', message: `图床返回错误：${upstreamRes.status}` } },
        { status: upstreamRes.status }
      );
    }

    const upstreamData = await upstreamRes.json();
    const parsed = providerInfo.parseResponse(upstreamData);

    if (!parsed?.url) {
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: '图床返回数据格式不符合预期' } },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, url: parsed.url });
  } catch (err: any) {
    console.error('[upload] error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message || '服务器内部错误' } },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add lib/image-upload.ts app/api/upload/
git commit -m "feat: implement image upload API"
```

---

### Task 4.2: 实现撤销/重做

**Files:**
- Modify: `lib/store.ts`

**Step 1: 扩展 Store 添加历史栈**

在 `EditorStore` 接口添加：
```typescript
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

  // 辅助
  canUndo: boolean;
  canRedo: boolean;
```

在 store 实现中添加：
```typescript
    history: {
      past: [],
      present: null,
      future: [],
    },
    canUndo: false,
    canRedo: false,

    pushHistory: (document) => {
      set(state => {
        const MAX_HISTORY = 30;
        const snapshot = JSON.parse(JSON.stringify(document));

        if (state.history.present) {
          state.history.past.push(state.history.present);
        }

        state.history.present = snapshot;
        state.history.future = [];

        if (state.history.past.length > MAX_HISTORY) {
          state.history.past.shift();
        }

        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;
      });
    },

    undo: () => {
      set(state => {
        const { past, present, future } = state.history;

        if (past.length === 0 || !present) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        state.history = {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };

        state.canUndo = newPast.length > 0;
        state.canRedo = true;

        // 重新加载到 Store
        get().loadDocument(previous);
      });
    },

    redo: () => {
      set(state => {
        const { past, present, future } = state.history;

        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        state.history = {
          past: [...past, present!],
          present: next,
          future: newFuture,
        };

        state.canUndo = true;
        state.canRedo = newFuture.length > 0;

        get().loadDocument(next);
      });
    },
```

**Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: implement undo/redo with history stack"
```

---

## Phase 5: 测试与部署

### Task 5.1: 创建完整功能测试页面

**Files:**
- Modify: `app/page.tsx`

**Step 1: 实现完整功能页面**

修改文件：`app/page.tsx` 为完整的应用（包含工具栏、编辑器、快捷键等）

**Step 2: 验证所有功能**

- ✅ 创建新文档
- ✅ 编辑节点内容
- ✅ 折叠/展开节点
- ✅ 撤销/重做
- ✅ 导入/导出 JSON
- ✅ AI 重组（需要 API Key）
- ✅ 图片上传（需要图床 API Key）

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement complete application UI"
```

---

### Task 5.2: 构建配置

**Files:**
- Modify: `next.config.js`
- Create: `.env.local.example`

**Step 1: 配置构建优化**

修改文件：`next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

**Step 2: 创建环境变量示例**

创建文件：`.env.local.example`

```bash
# OpenAI API Key (用于 AI 重组)
OPENAI_API_KEY=your_openai_api_key_here

# 图床配置 (可选)
IMGUR_API_KEY=your_imgur_api_key_here
```

**Step 3: 验证构建**

运行：`npm run build`

预期：构建成功，无错误

**Step 4: Commit**

```bash
git add next.config.js .env.local.example
git commit -m "chore: add build configuration and env example"
```

---

## 验收标准总结

### Phase 0: 项目初始化
- ✅ Next.js 项目创建成功
- ✅ 所有依赖安装完成
- ✅ 目录结构按规范建立
- ✅ 开发服务器可以正常启动

### Phase 1: 基础数据层
- ✅ Zustand Store 可以管理扁平化节点
- ✅ buildDocumentTree() 正确转换数据
- ✅ loadDocument() 正确加载数据
- ✅ IndexedDB 可以保存和读取文档
- ✅ 测试页面验证存取功能正常

### Phase 2: 核心 UI 编辑器
- ✅ 大纲树正确渲染
- ✅ 节点按层级缩进
- ✅ 可以编辑节点内容
- ✅ 编辑实时更新到 Store
- ✅ 折叠/展开功能正常

### Phase 3: AI 重组集成
- ✅ AI Schema 定义完整
- ✅ Server Action 可以调用 AI API
- ✅ Diff 算法可以计算差异
- ✅ 重组预览 UI 显示正确

### Phase 4: 工具链与打磨
- ✅ 图床上传功能正常
- ✅ 撤销/重做功能正常
- ✅ 快捷键可以触发操作
- ✅ 导入/导出功能正常

### Phase 5: 测试与部署
- ✅ 所有功能集成测试通过
- ✅ 生产构建成功
- ✅ 环境变量配置完整

---

## 开发注意事项

1. **数据结构转换**
   - Store 始终保持扁平化（children 存储 ID 数组）
   - 保存/导出时调用 buildDocumentTree()
   - 加载/导入时调用 loadDocument()

2. **ID 生成**
   - 统一使用 `crypto.randomUUID()`
   - 不要引入第三方 UUID 库

3. **AI Diff 局限性**
   - 基于内容匹配，重名和改名可能不准确
   - 在 UI 中适当提示用户

4. **性能优化**
   - 使用 React.memo 包裹 OutlineNode
   - 使用 Zustand Selector 避免不必要的重渲染

5. **错误处理**
   - 所有 API 调用都要有 try-catch
   - 用户友好的错误提示

---

*计划生成时间: 2026-02-08*

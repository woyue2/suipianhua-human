# 前端开发规范
> 本项目基于 Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Zustand + Dexie.js + Vercel AI SDK。  
> 目标：保证代码风格统一、可维护、可扩展，并与设计规格（spec-draft.md）保持一致。
---
## 一、技术栈与工具链
- 框架：Next.js 14+，使用 App Router
- 语言：TypeScript（强模式）
- 样式：Tailwind CSS
- UI 组件库：shadcn/ui（基于 Radix + Tailwind）
- 状态管理：Zustand，配合 immer 中间件处理深层更新
- 本地存储：IndexedDB，封装库 Dexie.js
- AI 集成：Vercel AI SDK（generateObject），校验使用 Zod
- 图床上传：自定义 Next.js Route Handler 代理
- IDE：推荐 VS Code + ESLint + Prettier
- 包管理：npm / pnpm / yarn（团队统一）
---
## 二、项目结构与目录约定
- 所有源码位于 `src/` 下，遵循下列分层：
```text
src/
├── app/                # Next.js App Router：layout.tsx、page.tsx、api/、actions/
├── components/         # React 组件（展示层），按业务分组：editor/、ai/、ui/
├── lib/               # 核心逻辑封装：db.ts、store.ts、ai.ts、ai-schema.ts、image.ts
├── types/             # 类型定义统一导出
└── utils/             # 工具函数：tree-diff.ts、format.ts、uuid.ts
```
- 组件按功能分组：
  - `components/editor/`：大纲编辑器相关（Editor、OutlineTree、OutlineNode 等）
  - `components/ai/`：AI 功能交互（AIReorganizeModal、PlanPreview 等）
  - `components/ui/`：基础 UI 组件（shadcn/ui 生成与扩展）
- `lib/` 下的文件用于封装第三方库和核心逻辑，避免组件直接依赖具体实现细节。
---
## 三、Next.js 与 React 组件规范
### 3.1 `'use client'` 使用
- 所有交互组件（使用 React hooks、事件处理、Zustand store 等）必须在文件首行添加：
```ts
'use client';
```
- 典型需要加 `'use client'` 的组件：
  - `components/` 下绝大多数组件
  - `hooks/` 下的自定义 hooks
- 通常不需要 `'use client'` 的文件：
  - `app/api/` 下的 Route Handlers
  - `app/actions/` 下的 Server Actions
  - `lib/db.ts`（纯 Dexie 封装）
### 3.2 组件组织与命名
- 组件文件名使用 PascalCase，与组件名一致：
  - `components/editor/OutlineNode.tsx` → `export const OutlineNode = ...`
- 一个文件默认导出一个主组件，必要时导出小型子组件或类型。
- 优先使用函数组件 + hooks，避免 class 组件。
### 3.3 Props 设计
- 尽量减少 Props 层层透传，优先从 Zustand store 订阅数据：
  - ✅ 推荐：`const document = useEditorStore(s => s.document);`
  - ❌ 避免：层层传递 `<Editor document={document} />`
- 如果必须传 Props，使用 interface 或 type 明确类型并导出。
- 事件处理函数命名以 `handle` 开头：`handleSubmit`、`handleFileChange`、`onClose` 等。
### 3.4 渲染性能（编辑器场景）
- 递归/长列表组件务必使用 `React.memo` 包裹，配合精准的 selector 订阅：
  - 例：`export const OutlineNode = memo(function OutlineNode({ nodeId }: { nodeId: string }) { ... })`
- 避免在组件内部创建复杂对象/函数（必要时用 `useMemo` / `useCallback`）。
- 输入控件使用 `<input>` + CSS 去边框，而非 `contenteditable`。
### 3.5 组件内部结构示例
```tsx
'use client';
import { memo } from 'react';
import { useEditorStore } from '@/lib/store';
export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: Props) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);
  return (
    <div className="flex" style={{ marginLeft: depth * 24 }}>
      {/* UI */}
    </div>
  );
});
```
---
## 四、状态管理：Zustand + Immer 使用规范
### 4.1 Store 定义
- Store 定义在 `lib/store.ts` 中，使用 immer 中间件，以支持“写式”更新深层状态。
- 状态尽量扁平化存储（如 `nodes: Record<string, OutlineNode>`），避免深层嵌套树直接存入 store。
```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
interface EditorStore {
  nodes: Record<string, OutlineNode>;
  rootId: string;
  // ...
}
export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    nodes: {},
    rootId: '',
    // actions
  }))
);
```
### 4.2 组件中订阅 Store
- 总是使用 selector 精准订阅，避免全量订阅造成过度渲染：
  - ✅ `const node = useEditorStore(s => s.nodes[nodeId]);`
  - ❌ `const state = useEditorStore();`（仅少数需要多个字段、且更新频率低的场景允许）
### 4.3 更新状态
- 使用 Immer 允许直接写式更新，但仍需注意：
  - 不要在 action 中做过多业务逻辑（如有需要，抽到 `lib/` 下的工具函数）。
  - 异步操作在 action 内部自行处理（如 `saveDocument`）。
```ts
updateNodeContent: (id, content) => {
  set(state => {
    if (state.nodes[id]) {
      state.nodes[id].content = content;
    }
  });
}
```
---
## 五、类型定义与数据流
### 5.1 类型集中管理
- 所有业务类型在 `types/index.ts` 中统一导出，避免到处重复定义。
```ts
export type { OutlineNode, Document, UserConfig, ReorganizePlan, ReorganizeChange } from './types';
```
- 组件内部局部类型可在组件文件中定义，但公共类型务必在 `types/` 中。
### 5.2 数据流设计
- 用户操作 → Zustand store 更新 → 内存状态变更 → 持久化到 IndexedDB（通过 hook/action）
- AI 重组/图床上传通过 Server Action 或 Route Handler 触发，前端通过 fetch 或 actions 调用，结果写入 store。
- 不要绕过 store 直接修改全局数据；所有“写操作”通过 store action 完成。
---
## 六、样式与 UI 组件规范
### 6.1 Tailwind CSS 使用
- 样式优先使用 Tailwind 工具类，避免内联 style，除非动态值无法覆盖（如缩进 `marginLeft: depth * 24`）。
- 尽量复用语义化工具类，而非重复写具体颜色值（如用 `text-gray-900` 而非随意写颜色 hex）。
- 组件使用 `className` 而非 `class`。
### 6.2 shadcn/ui 组件
- 项目统一使用 shadcn/ui 作为基础组件库。
- 新增基础组件通过 CLI 添加：`npx shadcn-ui@latest add button dialog input toast` 等。
- 不要直接修改 `components/ui/` 下的文件，如需定制，使用组合/覆盖 className。
### 6.3 图标与 emoji
- 图标优先使用 Lucide-React（shadcn/ui 默认），保持风格统一。
- 简单占位或原型阶段可使用 emoji，但正式 UI 应统一迁移为图标。
---
## 七、持久化与外部 API 调用规范
### 7.1 IndexedDB（Dexie.js）
- 所有 DB 操作封装在 `lib/db.ts`，组件不直接导入 Dexie 或操作 DB。
- 配置使用 `configDb`，文档使用 `documentDb`。
- configs 表的 key 为 string，不要使用自增 `++key`。
### 7.2 AI 调用（Vercel AI SDK）
- AI 调用逻辑封装在 `app/actions/ai.ts` 中（Server Action）。
- 使用 `generateObject` + Zod Schema 确保返回类型安全。
- 组件通过调用 Server Action 获取结果，前端负责渲染与状态更新。
### 7.3 图床上传（自定义代理）
- 图床元信息配置在 `lib/image-upload.ts`：`IMAGE_PROVIDERS`，包含不同图床的上传地址、headers、表单字段、解析函数。
- 后端 Route Handler：`app/api/upload/route.ts`，前端通过 `fetch('/api/upload', ...)` 调用。
- 配置（provider、apiKey、customUrl）通过 headers 传递（如 `x-image-provider`、`x-image-api-key`、`x-image-custom-url`）。
### 7.4 文档列表同步（MVP 阶段）
**数据流设计：**
```
用户打开应用 → 前端触发 fetchDocuments → 调用后端 /api/documents
→ 后端从 Dexie 获取数据 → 前端更新 store → 组件渲染文档列表
```
**后端实现：**
- 创建 `app/api/documents/route.ts` 暴露 API，返回所有文档的元数据（id、title、updatedAt 等）
- 使用 `documentDb.listDocuments()` 从 Dexie 获取文档列表
- 返回统一格式：`{ success: true, data: documents }`
**前端实现：**
- Store 中添加文档列表状态：
  ```ts
  interface EditorStore {
    documents: Array<{ id: string; title: string; updatedAt: number }>;
    isLoadingDocuments: boolean;
    fetchDocuments: () => Promise<void>;
  }
  ```
- 组件通过 `useEffect` 触发 `fetchDocuments`，并订阅 store 中的 `documents` 状态
- 使用 `isLoadingDocuments` 展示加载状态（骨架屏或 loading 提示）
**注意事项：**
- MVP 阶段：所有文档平铺展示（不支持文件夹功能）
- 后续迭代：可扩展文件夹功能（folderId 字段、嵌套结构、筛选逻辑）
- 错误处理：后端返回错误时前端捕获并记录日志，可添加 Toast 提示
---
## 八、Hooks 封装与复用
### 8.1 常见 hooks
- `useAutoSave`：自动保存逻辑
- `useAutoHistory`：防抖的历史记录
- `useKeyboardShortcuts`：全局快捷键
- `useDocumentIO`：导入/导出逻辑
- `useEditorStore(selector)`：使用 selector 的简写（如需）
### 8.2 编写自定义 Hook 规范
- Hook 文件放在 `hooks/` 下，命名以 `use` 开头。
- 内部依赖 store 或外部函数时，通过参数或 store selector 获取，避免闭包引用过时状态。
- 异步副作用在 `useEffect` 中处理，并正确清理（移除监听器、定时器）。
---
## 九、错误处理与用户反馈
### 9.1 错误边界
- 生产环境为根布局添加 `ErrorBoundary`，捕获未预期异常。
- UI 组件中针对可预期错误（上传失败、导入格式错误）使用友好提示。
### 9.2 Toast 提示
- 使用 sonner/类似 toast 库进行提示，统一风格。
- 操作成功/失败均给出即时反馈：`toast.success('导入成功')`、`toast.error('上传失败：xxx')`。
---
## 十、命名与注释规范
### 10.1 命名
- 文件名：PascalCase（组件）或 kebab-case（工具/ hooks，如 `use-document-io.ts`）
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE（如 `MAX_HISTORY`、`MAX_FILE_SIZE`）
- 类型/接口：PascalCase，语义清晰
### 10.2 注释
- 复杂算法/业务逻辑必须注释说明意图（如 Diff 算法、历史栈管理）。
- 组件顶部简要说明职责与 Props：
  ```ts
  // OutlineNode: 递归大纲节点组件，根据 depth 控制缩进
  ```
- 不对显而易见的代码行添加无效注释。
---
## 十一、Git 提交信息与协作规范
### 11.1 Commit Message 风格（建议）
- 采用约定式提交（Conventional Commits）风格：
```text
feat(editor): 支持折叠/展开节点交互
fix(ai): 修复重组预览 diff 计算错误
refactor(store): 扁平化节点存储结构
docs(spec): 更新前端开发规范文档
chore(deps): 升级 Next.js 到 14.2
```
### 11.2 分支策略（简版）
- `main`：主干，用于发布稳定版本
- `dev`/`develop`：开发集成分支
- `feat/xxx`：功能分支
- `fix/xxx`：修复分支
### 11.3 Code Review 关注点
- 组件是否使用 `'use client'`
- 是否存在全量 store 订阅导致性能问题
- 是否存在绕过 store 直接操作全局状态
- 类型是否完整，有无 `any` 泛化（除非确实无法避免）
- 异常是否被捕获并反馈到 UI
---
## 十二、可逐步补充的内容（实现阶段）
- 环境变量管理（如 AI Key 是否通过环境变量配置）
- 测试策略（单元测试、组件测试、E2E 测试）
- 国际化（i18n）预留（若未来需要多语言）
- 性能监控与错误上报（Sentry/类似服务）
---
> 本规范应与 `spec-draft.md` 保持同步更新；如有冲突或补充，以团队实际需求为准。

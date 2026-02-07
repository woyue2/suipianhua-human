# 后端开发规范（Next.js App Router）
> 本规范基于项目技术栈（Next.js 14+、TypeScript、Server Actions、Route Handlers、Dexie.js、Vercel AI SDK）制定，旨在保证后端代码的一致性、可维护性和安全性。
## 一、项目结构与职责划分
### 1.1 目录结构
后端相关代码位于 `app/` 目录下，遵循以下分层：
```text
app/
├── api/                # Route Handlers（HTTP 请求处理）
│   ├── ai/             # AI 相关接口（如重组、生成）
│   │   └── reorganize/ # AI 重组接口
│   └── upload/         # 图床上传代理接口
└── actions/            # Server Actions（复杂业务逻辑）
    └── index.ts        # 统一导出所有服务端操作
```
### 1.2 职责划分
- **Route Handlers（`app/api/`）**：  
  负责处理 HTTP 请求（GET/POST/PUT/DELETE），作为前端与后端的“桥梁”。  
  - 示例：`app/api/upload/route.ts` 处理图片上传请求，代理到第三方图床。  
- **Server Actions（`app/actions/`）**：  
  执行复杂业务逻辑（如 AI 调用、数据持久化），可被客户端直接调用（通过 `useActionState` 或 `useAction`）。  
  - 示例：`app/actions/ai.ts` 调用 Vercel AI SDK 生成重组计划。
## 二、API 设计规范（Route Handlers）
### 2.1 基础结构
所有 Route Handlers 必须遵循以下结构：
```typescript
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    // 1. 参数解析（从 Header/Body/Query 获取）
    const config = getConfigFromRequest(req); // 示例：从 Header 获取图床配置
    // 2. 业务逻辑（调用 Server Action 或直接处理）
    const result = await handleUploadLogic(config, req.body); // 示例：处理上传
    // 3. 统一响应格式
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 4. 错误处理
    return handleApiError(error);
  }
}
```
### 2.2 响应格式
所有 API 必须返回统一 JSON 格式：
```json
{
  "success": boolean,   // 是否成功
  "data": any,         // 成功时的数据（可选）
  "error": string      // 失败时的错误信息（可选）
}
```
### 2.3 参数验证
- 使用 `zod` 对请求参数进行校验（如 Header、Body、Query）。  
- 示例：图床上传接口的 Header 验证：
  ```typescript
  import { z } from 'zod';
  const UploadConfigSchema = z.object({
    provider: z.enum(['imgur', 'smms', 'custom']),
    apiKey: z.string().min(1),
    customUrl: z.string().optional(),
  });
  function getConfigFromRequest(req: NextRequest) {
    const headers = req.headers;
    const config = {
      provider: headers.get('x-image-provider'),
      apiKey: headers.get('x-image-api-key'),
      customUrl: headers.get('x-image-custom-url'),
    };
    return UploadConfigSchema.parse(config);
  }
  ```
### 2.4 文档列表 API（MVP 阶段）
**接口定义：** `GET /api/documents`

**功能：** 返回所有文档的元数据列表（平铺展示，不支持文件夹嵌套）

**实现示例：**
```typescript
// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { documentDb } from '@/lib/db';

export async function GET() {
  try {
    const documents = await documentDb.listDocuments();
    return NextResponse.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('[api/documents] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documents'
      },
      { status: 500 }
    );
  }
}
```

**返回数据格式：**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "title": "我的笔记",
      "updatedAt": 1705678900000
    }
  ]
}
```

**MVP 限制说明：**
- 所有文档平铺展示（无 folderId 字段）
- 按更新时间降序排列
- 后续迭代可扩展文件夹筛选功能
---

## 三、数据持久化与数据库操作（Dexie.js）
### 3.1 数据模型映射
- 后端数据模型必须与前端 `types/` 中的定义一致（如 `Document`、`UserConfig`）。  
- Dexie 表结构需与 TypeScript 接口对应（如 `configs` 表的 `key` 字段为 `string` 主键）。
### 3.2 CRUD 操作规范
- 所有数据库操作封装在 `lib/db.ts` 中，Route Handlers/Server Actions 通过调用这些方法操作数据。  
- 示例：保存文档：
  ```typescript
  // lib/db.ts
  export const documentDb = {
    async saveDocument(document: Document) {
      const now = Date.now();
      const existing = await db.documents.where('documentId').equals(document.id).first();
      if (existing) {
        await db.documents.update(existing.id!, { data: document, updatedAt: now });
      } else {
        await db.documents.add({ documentId: document.id, data: document, createdAt: now, updatedAt: now });
      }
    },
  };
  ```
### 3.3 事务处理
- 涉及多个表的操作（如同时更新文档和配置）需使用 Dexie 事务，确保数据一致性。  
- 示例：
  ```typescript
  await db.transaction('rw', db.documents, db.configs, async () => {
    await db.documents.put({ ... });
    await db.configs.put({ ... });
  });
  ```
### 3.4 MVP 阶段数据模型限制
**文件夹功能：**
- MVP 阶段不支持文件夹嵌套结构
- 所有文档平铺展示，无需 folderId 字段
- `documentDb.listDocuments()` 返回所有文档的数组（按更新时间排序）

**后续迭代方向（V2+）：**
- 新增 Folder 实体（id、name、parentId、children）
- Document 添加 folderId 外键
- 支持文件夹筛选：`documentDb.listDocuments(folderId)`
- 使用 Dexie 事务保证文件夹删除时的数据一致性

**当前架构优势：**
- API 已预留扩展性（通过查询参数传递 folderId）
- 前端 Store 无需大规模重构
- 数据模型设计考虑了未来的嵌套需求
---

## 四、AI 集成规范（Vercel AI SDK）
### 4.1 Prompt 设计
- Prompt 必须包含明确的指令（如“只返回 JSON 结构，不要包含 ID”），并使用 `zod` Schema 约束输出格式。  
- 示例：
  ```typescript
  const REORGANIZE_PROMPT = `
  你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。
  要求：
  1. 识别主题，创建父级分类
  2. 将相关内容归纳到分类下
  3. 只返回 JSON 结构，不要包含 ID
  原始内容：
  ${JSON.stringify(plainTextTree)}
  `;
  ```
### 4.2 输出验证
- 使用 `generateObject` + `Zod Schema` 确保 AI 输出符合预期，避免类型错误。  
- 示例：
  ```typescript
  import { generateObject } from 'ai';
  import { ReorganizeResultSchema } from '@/lib/ai-schema';
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ReorganizeResultSchema,
    prompt: REORGANIZE_PROMPT,
  });
  ```
## 五、安全与权限
### 5.1 API Key 管理
- 敏感信息（如 AI Provider Key、图床 API Key）**禁止**硬编码在代码中，需通过环境变量（`.env.local`）配置。  
- 后端通过 `process.env` 获取，前端通过 Header 传递（如 `x-image-api-key`），后端从 Header 读取。
### 5.2 输入验证
- 所有用户输入（如 JSON 导入、图片上传）必须通过 `zod` 校验，防止恶意数据。  
- 示例：JSON 导入校验：
  ```typescript
  const DocumentSchema = z.object({
    id: z.string(),
    title: z.string(),
    root: z.any(),
    metadata: z.object({ createdAt: z.number(), updatedAt: z.number() }),
  });
  function importFromJSON(jsonString: string): Document {
    const data = JSON.parse(jsonString);
    return DocumentSchema.parse(data);
  }
  ```
### 5.3 CORS 配置
- Next.js Route Handlers 默认处理 CORS，无需额外配置。  
- 若需自定义，可在 `next.config.js` 中设置 `async headers()`。
## 六、性能优化
### 6.1 流式处理
- AI 调用使用 `streamText` 或 `generateObject` 的流式模式，避免长时间等待。  
- 示例：AI 重组的流式响应：
  ```typescript
  export async function POST(req: NextRequest) {
    const stream = await streamText({
      model: openai('gpt-4o-mini'),
      prompt: REORGANIZE_PROMPT,
    });
    return new StreamingTextResponse(stream);
  }
  ```
### 6.2 数据库查询优化
- Dexie 查询使用索引（如 `documents` 表的 `documentId` 索引），避免全表扫描。  
- 示例：按 `documentId` 查询：
  ```typescript
  await db.documents.where('documentId').equals('doc-123').first();
  ```
## 七、代码风格与最佳实践
### 7.1 TypeScript 类型
- 所有函数、变量、参数必须显式声明类型，禁止使用 `any`（除非无法避免）。  
- 示例：
  ```typescript
  async function saveDocument(document: Document): Promise<void> { ... }
  ```
### 7.2 错误处理
- 区分客户端错误（400）和服务端错误（500），并记录详细日志。  
- 示例：
  ```typescript
  function handleApiError(error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
  ```
### 7.3 日志记录
- 使用 `console.error` 记录关键错误（如第三方 API 失败、数据库异常）。  
- 生产环境建议集成日志服务（如 Sentry）。
## 八、测试规范
### 8.1 单元测试
- 核心逻辑（如 AI Prompt、数据库 CRUD）需编写单元测试（使用 Jest/Vitest）。  
- 示例：测试文档保存逻辑：
  ```typescript
  test('saveDocument should update existing document', async () => {
    const doc = { id: 'doc-1', title: 'Test' };
    await documentDb.saveDocument(doc);
    const saved = await db.documents.where('documentId').equals('doc-1').first();
    expect(saved?.data.title).toBe('Test');
  });
  ```
### 8.2 集成测试
- Route Handlers 需测试 HTTP 请求的响应（使用 `@playwright/test`）。  
- 示例：测试图床上传接口：
  ```typescript
  test('upload should return image URL', async ({ request }) => {
    const formData = new FormData();
    formData.append('file', fs.readFileSync('test.jpg'), 'test.jpg');
    const res = await request.post('/api/upload', {
      headers: { 'x-image-provider': 'imgur', 'x-image-api-key': 'test-key' },
      body: formData,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
  ```
## 九、部署与运维
### 9.1 环境变量
- 生产环境变量（如 `OPENAI_API_KEY`）需通过 Vercel/其他平台的环境变量配置，禁止提交到 Git。  
- 本地开发使用 `.env.local`，并添加到 `.gitignore`。
### 9.2 监控
- 部署后需监控 API 响应时间、错误率（如 Vercel Analytics、Sentry）。  
- 关键接口（如 AI 重组）需设置超时和重试机制。
---
本规范将随着项目迭代持续更新，请所有后端开发者严格遵守。

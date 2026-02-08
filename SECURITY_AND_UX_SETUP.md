# 安全与用户体验库配置说明

**配置时间**: 2026-02-08
**目的**: 提升 XSS 防护、用户体验通知和参数验证

---

## 已安装的库

```bash
npm install dompurify sonner zod
npm install -D @types/dompurify
```

---

## 1. DOMPurify - XSS 防护

### 用途
清理 HTML 字符串，防止跨站脚本攻击（XSS）

### 配置文件
**文件**: `lib/utils.ts`

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'mark', 'u', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
    ALLOWED_STYLE: [],
  });
}

export function renderMarkdown(text: string): string {
  // Markdown 转 HTML + 安全清理
}
```

### 使用方法
```typescript
import { sanitizeHTML, renderMarkdown } from '@/lib/utils';

// 直接清理 HTML
const safe = sanitizeHTML(userInput);

// Markdown 渲染（自动清理）
const rendered = renderMarkdown('**粗体** ==高亮==');
```

### 应用位置
- ✅ `components/editor/OutlineNode.tsx` - 替换 `dangerouslySetInnerHTML`
- ⚠️ 所有用户输入显示的地方都需要使用

---

## 2. Sonner - Toast 通知

### 用途
替换 `alert()`，提供更好的用户体验

### 配置文件
**文件**: `app/layout.tsx`

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
```

### 工具函数
**文件**: `lib/toast.ts`

```typescript
import { toast } from 'sonner';

export function toastSuccess(message: string) {
  toast.success(message);
}

export function toastError(message: string) {
  toast.error(message);
}

export function toastSaveSuccess() {
  toast.success('保存成功');
}

// ... 更多工具函数
```

### 使用方法
```typescript
import { toastSuccess, toastError, toastSaveSuccess } from '@/lib/toast';

// 基础用法
toastSuccess('操作成功');
toastError('操作失败');

// 预定义用法
toastSaveSuccess();

// Promise 包装
await toastPromise(
  saveDocument(),
  {
    loading: '保存中...',
    success: '保存成功',
    error: '保存失败',
  }
);
```

### 需要替换的位置
- ❌ `alert('导出失败')` → ✅ `toastError('导出失败')`
- ❌ `alert('导入失败：文件格式不正确')` → ✅ `toastImportError()`
- ❌ `console.log('✅ 保存成功')` → ✅ `toastSaveSuccess()`

---

## 3. Zod - 参数验证

### 用途
API 参数验证，确保类型安全

### 配置文件
**文件**: `lib/validation.ts`

```typescript
import { z } from 'zod';

// 文档查询参数验证
export const DocumentQuerySchema = z.object({
  folderId: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// 图片上传配置验证
export const ImageUploadConfigSchema = z.object({
  provider: z.enum(['imgur', 'smms', 'custom']),
  apiKey: z.string().min(1),
  customUrl: z.string().url().optional(),
});

// AI 重组参数验证
export const ReorganizeRequestSchema = z.object({
  document: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    root: z.object({
      id: z.string(),
      content: z.string(),
      children: z.array(z.any()),
    }),
  }),
});
```

### 使用方法
```typescript
import { DocumentQuerySchema } from '@/lib/validation';
import { parseAndValidateQuery } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  // 验证查询参数
  const query = parseAndValidateQuery(req, DocumentQuerySchema);

  if (!query.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  // 使用验证后的数据
  const { limit, offset, sortBy } = query.data;
}
```

### 应用位置
- ✅ `app/api/documents/route.ts` - 已应用
- ⚠️ `app/api/upload/route.ts` - 待应用
- ⚠️ `app/api/ai/reorganize/route.ts` - 待应用

---

## 迁移指南

### 第一步：替换 alert() 为 toast

**之前**:
```typescript
alert('保存成功');
alert('导出失败');
```

**之后**:
```typescript
import { toastSuccess, toastError } from '@/lib/toast';

toastSuccess('保存成功');
toastError('导出失败');
```

### 第二步：添加 XSS 防护

**之前**:
```typescript
dangerouslySetInnerHTML={{ __html: renderFormattedText(node.content) }}
```

**之后**:
```typescript
import { renderMarkdown } from '@/lib/utils';

dangerouslySetInnerHTML={{ __html: renderMarkdown(node.content) }}
```

### 第三步：添加 API 参数验证

**之前**:
```typescript
const provider = req.headers.get('x-image-provider') || 'imgur';
const apiKey = req.headers.get('x-image-api-key') || '';
```

**之后**:
```typescript
import { ImageUploadConfigSchema } from '@/lib/validation';

const config = {
  provider: req.headers.get('x-image-provider'),
  apiKey: req.headers.get('x-image-api-key'),
  customUrl: req.headers.get('x-image-custom-url'),
};

const validated = ImageUploadConfigSchema.parse(config);
```

---

## 验证清单

- [x] 安装依赖包
- [x] 创建 lib/utils.ts (DOMPurify 配置)
- [x] 创建 lib/toast.ts (Sonner 工具函数)
- [x] 更新 app/layout.tsx (添加 Toaster)
- [ ] 更新 OutlineNode.tsx (使用 renderMarkdown)
- [ ] 更新 Header.tsx (替换 alert 为 toast)
- [ ] 更新 Sidebar.tsx (替换 alert 为 toast)
- [ ] 更新 upload API (添加 Zod 验证)
- [ ] 更新 AI API (添加 Zod 验证)

---

## 注意事项

### DOMPurify
- 只允许必要的标签和属性
- 定期审查安全配置
- 不要清理整个文档，只清理用户输入部分

### Sonner
- 使用语义化的提示信息
- 错误信息要具体，帮助用户理解问题
- 不要过度使用通知，避免打扰用户

### Zod
- 在 API 入口处立即验证
- 返回清晰的错误信息
- 记录验证失败日志（用于调试）

---

## 相关文档
- [DOMPurify 文档](https://github.com/cure53/DOMPurify)
- [Sonner 文档](https://sonner.emilkowal.dk/)
- [Zod 文档](https://zod.dev/)
- [前端开发规范](../guide/前端开发-guide.md)
- [后端开发规范](../guide/后端开发-guide.md)

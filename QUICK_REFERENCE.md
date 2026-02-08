# 快速参考指南 - 自定义 Hooks 和 Zod 验证

## 📚 目录结构

```
tree-index/
├── lib/
│   ├── validation.ts       # Zod Schema 定义
│   └── api-utils.ts        # API 工具函数
├── hooks/
│   └── useEditor.ts        # 自定义 Hooks
├── app/api/
│   ├── upload/route.ts     # 重构后的上传接口
│   ├── documents/route.ts  # 重构后的文档接口
│   └── ai/reorganize/route.ts  # 重构后的 AI 接口
└── components/editor/
    └── OutlineNodeRefactored.tsx  # 重构后的组件示例
```

---

## 🎯 快速开始

### 1. 创建新的 API 路由

```typescript
// app/api/example/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  handleApiError,
  parseAndValidateBody,
  createSuccessResponse,
} from '@/lib/api-utils';

// 定义 Schema
const RequestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    // 验证请求体
    const data = await parseAndValidateBody(req, RequestSchema);
    
    // 业务逻辑
    const result = { message: `Hello ${data.name}, age ${data.age}` };
    
    // 返回响应
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. 在组件中使用 Hooks

```typescript
// components/MyComponent.tsx
import { useNodeOperations, useToolbarState } from '@/hooks/useEditor';

export function MyComponent({ nodeId }: { nodeId: string }) {
  // 使用节点操作 Hook
  const operations = useNodeOperations(nodeId);
  
  // 使用工具栏状态 Hook
  const toolbar = useToolbarState(nodeId);
  
  return (
    <div>
      <button onClick={() => operations.addChild()}>
        添加子节点
      </button>
      <button onClick={toolbar.activateToolbar}>
        显示工具栏
      </button>
    </div>
  );
}
```

---

## 📖 API 工具函数

### `handleApiError(error)`
统一错误处理，自动识别错误类型并返回合适的响应。

```typescript
try {
  // 业务逻辑
} catch (error) {
  return handleApiError(error);
}
```

### `parseAndValidateBody(req, schema)`
解析并验证 JSON 请求体。

```typescript
const data = await parseAndValidateBody(req, MySchema);
```

### `parseAndValidateHeaders(req, schema, mapping)`
解析并验证请求头。

```typescript
const config = parseAndValidateHeaders(
  req,
  ConfigSchema,
  { apiKey: 'x-api-key' }
);
```

### `parseAndValidateQuery(req, schema)`
解析并验证查询参数。

```typescript
const query = parseAndValidateQuery(req, QuerySchema);
```

### `createSuccessResponse(data, status?)`
创建成功响应。

```typescript
return createSuccessResponse({ message: 'Success' });
```

### `validateFileUpload(file, maxSize?, allowedTypes?)`
验证文件上传。

```typescript
validateFileUpload(file, 5 * 1024 * 1024, ['image/png', 'image/jpeg']);
```

---

## 🎨 自定义 Hooks

### `useToolbarState(nodeId)`
管理工具栏状态。

```typescript
const toolbar = useToolbarState(nodeId);

// 属性
toolbar.showToolbar          // 是否显示操作工具栏
toolbar.showFormatToolbar    // 是否显示格式工具栏

// 方法
toolbar.activateToolbar()           // 激活操作工具栏
toolbar.deactivateToolbar()         // 关闭操作工具栏
toolbar.activateFormatToolbar()     // 激活格式工具栏
toolbar.deactivateFormatToolbar()   // 关闭格式工具栏
```

### `useNodeOperations(nodeId)`
封装节点操作。

```typescript
const ops = useNodeOperations(nodeId);

ops.updateContent(content)   // 更新内容
ops.toggleCollapse()         // 切换折叠
ops.addChild()               // 添加子节点
ops.addSibling()             // 添加兄弟节点
ops.deleteNode()             // 删除节点
ops.indent()                 // 增加缩进
ops.outdent()                // 减少缩进
ops.moveUp()                 // 上移
ops.moveDown()               // 下移
```

### `useTextFormatting()`
处理文本格式化。

```typescript
const fmt = useTextFormatting();

// 渲染格式化文本
const html = fmt.renderFormattedText('**粗体** *斜体*');

// 应用格式
const formatted = fmt.applyFormat(content, 'bold');

// 选择范围
fmt.selectionRange           // { start: number, end: number } | null
fmt.setSelectionRange(range) // 设置选择范围
```

### `useHoverDelay(callback, delay)`
处理悬停延迟。

```typescript
const hover = useHoverDelay(() => showToolbar(), 1000);

hover.startHover()   // 开始悬停计时
hover.cancelHover()  // 取消悬停
```

### `useNodeKeyboard(nodeId, operations)`
处理键盘快捷键。

```typescript
const keyboard = useNodeKeyboard(nodeId, operations);

<input onKeyDown={(e) => keyboard.handleKeyDown(e, content)} />
```

### `useTextSelection(inputRef, onSelect)`
处理文本选择。

```typescript
const { handleTextSelect } = useTextSelection(
  inputRef,
  (start, end, rect) => {
    console.log('Selected:', start, end);
  }
);

<input onSelect={handleTextSelect} onMouseUp={handleTextSelect} />
```

---

## 🔍 Zod Schema 示例

### 基础类型

```typescript
import { z } from 'zod';

// 字符串
z.string()
z.string().min(1, '不能为空')
z.string().max(100, '最多100字符')
z.string().email('邮箱格式不正确')
z.string().url('URL格式不正确')

// 数字
z.number()
z.number().int('必须是整数')
z.number().positive('必须是正数')
z.number().min(0).max(100)

// 布尔
z.boolean()

// 枚举
z.enum(['option1', 'option2', 'option3'])

// 可选
z.string().optional()
z.number().nullable()

// 默认值
z.string().default('default value')
z.number().default(0)
```

### 对象 Schema

```typescript
const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).default('user'),
});

type User = z.infer<typeof UserSchema>;
```

### 数组 Schema

```typescript
const TagsSchema = z.array(z.string());
const UsersSchema = z.array(UserSchema);
```

### 嵌套 Schema

```typescript
const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  author: UserSchema,
  tags: z.array(z.string()),
  metadata: z.object({
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
});
```

---

## 💡 最佳实践

### 1. API 路由结构

```typescript
export async function POST(req: NextRequest) {
  try {
    // 1. 验证参数
    const data = await parseAndValidateBody(req, Schema);
    
    // 2. 业务逻辑
    const result = await processData(data);
    
    // 3. 返回响应
    return createSuccessResponse(result);
  } catch (error) {
    // 4. 错误处理
    return handleApiError(error);
  }
}
```

### 2. 组件结构

```typescript
export function MyComponent({ nodeId }: Props) {
  // 1. 使用 Hooks
  const operations = useNodeOperations(nodeId);
  const toolbar = useToolbarState(nodeId);
  
  // 2. 本地状态
  const [isEditing, setIsEditing] = useState(false);
  
  // 3. 事件处理
  const handleClick = () => {
    operations.addChild();
  };
  
  // 4. 渲染
  return <div>...</div>;
}
```

### 3. Schema 定义

```typescript
// 在 lib/validation.ts 中集中定义
export const MySchema = z.object({
  field1: z.string(),
  field2: z.number(),
});

export type MyType = z.infer<typeof MySchema>;
```

---

## 🐛 常见问题

### Q: Zod 验证失败如何处理？
A: `handleApiError` 会自动捕获 `ZodError` 并返回 400 错误和友好的错误信息。

### Q: 如何自定义错误信息？
A: 在 Schema 中添加错误信息：
```typescript
z.string().min(1, '自定义错误信息')
```

### Q: Hook 中的 useCallback 是必需的吗？
A: 是的，可以避免不必要的重渲染，提高性能。

### Q: 如何测试使用了 Hooks 的组件？
A: 使用 `@testing-library/react-hooks` 进行测试：
```typescript
import { renderHook } from '@testing-library/react-hooks';

test('useNodeOperations', () => {
  const { result } = renderHook(() => useNodeOperations('node-1'));
  expect(result.current.addChild).toBeDefined();
});
```

---

## 📚 相关文档

- [Zod 官方文档](https://zod.dev/)
- [React Hooks 文档](https://react.dev/reference/react)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [后端开发指南](./docs/guide/后端开发-guide.md)

---

**最后更新**: 2026-02-08  
**维护者**: AI Assistant


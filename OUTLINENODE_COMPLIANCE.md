# OutlineNode.tsx 规范符合性详细检查

**文件**: `components/editor/OutlineNode.tsx`
**行数**: 403 行
**检查时间**: 2026-02-08

---

## ✅ 符合规范的项

### 1. 'use client' 声明 ✅
```typescript
'use client'; // 第1行 - ✅ 符合
```

### 2. React.memo 使用 ✅
```typescript
export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  // ...
}); // ✅ 符合规范 - 递归组件使用 memo 优化
```

### 3. 精准的 Store 订阅 ✅
```typescript
// ✅ 符合规范 - 使用 selector 精准订阅
const node = useEditorStore(s => s.nodes[nodeId]);
const updateContent = useEditorStore(s => s.updateContent);
const toggleCollapse = useEditorStore(s => s.toggleCollapse);
// ... 其他 selector
```

### 4. Props 类型定义 ✅
```typescript
interface OutlineNodeProps {
  nodeId: string;
  depth: number;
} // ✅ 符合规范 - 明确定义 Props 类型
```

### 5. 图标使用 ✅
```typescript
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Bold, Italic, Underline, Highlighter } from 'lucide-react';
// ✅ 符合规范 - 使用 Lucide-React 图标库
```

### 6. 事件处理命名 ✅
```typescript
// ✅ 符合规范 - 事件处理函数以 handle 开头
const handleMouseEnter = (e: React.MouseEvent) => { ... };
const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { ... };
const handleAddChild = () => { ... };
```

### 7. useEffect 清理 ✅
```typescript
useEffect(() => {
  return () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };
}, []); // ✅ 符合规范 - 正确清理定时器
```

---

## ⚠️ 需要注意的问题

### 1. 文件过长 ⚠️
**问题**: 403 行代码，建议拆分

**影响**:
- 可维护性降低
- 难以定位问题
- 违反单一职责原则

**建议**:
```
components/editor/
├── OutlineNode.tsx          # 主组件 (~150行)
├── OutlineNodeToolbar.tsx    # 操作工具栏 (~100行)
├── FormatToolbar.tsx         # 格式工具栏 (~80行)
└── hooks/
    └── useNodeFormatting.ts  # 格式化逻辑 (~50行)
```

### 2. 使用 dangerouslySetInnerHTML ⚠️
**问题**: 存在 XSS 安全风险

```typescript
// ⚠️ 第266行 - 使用 dangerouslySetInnerHTML
dangerouslySetInnerHTML={{
  __html: node.content ? renderFormattedText(node.content) : '...'
}}
```

**风险**: 如果用户内容包含恶意脚本，会被执行

**建议**: 使用 DOMPurify 清理
```typescript
import DOMPurify from 'dompurify';

dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(renderFormattedText(node.content))
}}
```

### 3. 使用 setTimeout 进行焦点管理 ⚠️
**问题**: setTimeout(f, 0) 可能不够可靠

```typescript
// ⚠️ 多处使用 - 不够优雅
setTimeout(() => {
  const newInput = document.querySelector(`input[data-node-id="${newId}"]`);
  if (newInput) newInput.focus();
}, 0);
```

**建议**: 使用 useLayoutEffect 或 useCallback + ref
```typescript
const focusNewNode = useCallback((nodeId: string) => {
  requestAnimationFrame(() => {
    const newInput = document.querySelector(`input[data-node-id="${nodeId}"]`);
    newInput?.focus();
  });
}, []);
```

### 4. 组件内部状态过多 ⚠️
**问题**: 11 个 useState，复杂度高

```typescript
// ⚠️ 第26-32行 - 11个局部状态
const [showToolbar, setShowToolbar] = useState(false);
const [showFormatToolbar, setShowFormatToolbar] = useState(false);
const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
const [formatToolbarPosition, setFormatToolbarPosition] = useState({ x: 0, y: 0 });
const [selectedText, setSelectedText] = useState('');
const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
const [isEditing, setIsEditing] = useState(false);
// ...
```

**建议**: 提取到自定义 hook
```typescript
// hooks/useToolbarState.ts
export function useToolbarState() {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  // ...
  return { showToolbar, toolbarPosition, ... };
}

// hooks/useTextFormatting.ts
export function useTextFormatting(nodeId: string) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  // ...
  return { selectedText, selectionRange, applyFormat, ... };
}
```

---

## ❌ 不符合规范的项

### 1. 直接使用 document.querySelector ❌
**规范要求**: 避免 DOM 操作，优先使用 ref

```typescript
// ❌ 第165行 - 直接 DOM 查询
const newInput = document.querySelector(`input[data-node-id="${newId}"]`);
```

**建议**: 将返回的 newId 传递给子组件
```typescript
// 更好的方式：使用 ref 回调
const focusQueueRef = useRef<string[]>([]);

const queueFocus = (nodeId: string) => {
  focusQueueRef.current.push(nodeId);
};

// 在子组件中
useEffect(() => {
  if (focusQueueRef.current.includes(nodeId)) {
    inputRef.current?.focus();
    focusQueueRef.current = focusQueueRef.current.filter(id => id !== nodeId);
  }
}, [nodeId]);
```

### 2. 复杂的内联样式对象 ❌
**规范要求**: 优先使用 Tailwind CSS 类

```typescript
// ❌ 第285-290行 - 内联样式对象
style={{
  left: `${toolbarPosition.x}px`,
  transform: 'translateX(-50%)',
  top: `${toolbarPosition.y}px`,
  pointerEvents: 'auto'
}}
```

**建议**: 动态值可以接受，但考虑封装成组件
```typescript
// components/ui/FloatingToolbar.tsx
interface FloatingToolbarProps {
  x: number;
  y: number;
  children: React.ReactNode;
}

export function FloatingToolbar({ x, y, children }: FloatingToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1"
      style={{ left: `${x}px`, transform: 'translateX(-50%)', top: `${y}px` }}
    >
      {children}
    </div>
  );
}
```

### 3. 正则表达式性能问题 ⚠️
**问题**: renderFormattedText 每次渲染都执行正则替换

```typescript
// ⚠️ 第41-58行 - 每次渲染都执行
const renderFormattedText = (text: string) => {
  let formatted = text;
  formatted = formatted.replace(/==(.+?)==/g, ...);  // 正则1
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, ...); // 正则2
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, ...); // 复杂正则3
  return formatted;
};
```

**建议**: 使用 useMemo 缓存结果
```typescript
const renderedContent = useMemo(() => {
  return renderFormattedText(node.content);
}, [node.content]);
```

### 4. 字符位置估算不准确 ⚠️
**问题**: 使用固定宽度(8px)估算字符位置

```typescript
// ⚠️ 第76行 - 不准确的估算
x: rect.left + (start + end) / 2 * 8, // 粗略估算字符位置
```

**建议**: 使用 canvas 测量实际宽度
```typescript
const measureTextPosition = (text: string, start: number, end: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = getComputedStyle(inputRef.current!).font;
  const beforeWidth = ctx.measureText(text.substring(0, start)).width;
  const selectedWidth = ctx.measureText(text.substring(start, end)).width;
  return rect.left + beforeWidth + selectedWidth / 2;
};
```

---

## 📊 具体规范符合度

| 规范项 | 符合度 | 说明 |
|--------|--------|------|
| **'use client'** | ✅ 100% | 第1行正确声明 |
| **React.memo** | ✅ 100% | 正确使用 memo 包裹 |
| **Selector 订阅** | ✅ 100% | 所有订阅精准 |
| **Props 定义** | ✅ 100% | interface 定义清晰 |
| **图标使用** | ✅ 100% | Lucide-React |
| **事件命名** | ✅ 100% | handle 前缀 |
| **useEffect 清理** | ✅ 100% | 定时器正确清理 |
| **文件长度** | ⚠️ 403行 | 建议拆分 |
| **DOM 操作** | ❌ document.querySelector | 应使用 ref |
| **内联样式** | ⚠️ 部分 | 动态值可接受 |
| **性能优化** | ⚠️ 缺少 useMemo | 应缓存计算结果 |

**总体评分**: **75%** ⭐⭐⭐⭐

---

## 🎯 优化建议（优先级排序）

### 🔴 高优先级
1. **拆分组件** - 提取工具栏和格式工具栏
2. **添加 XSS 防护** - 使用 DOMPurify
3. **改进焦点管理** - 使用 ref 而非 DOM 查询

### 🟡 中优先级
4. **提取自定义 hooks** - useToolbarState, useTextFormatting
5. **添加性能优化** - useMemo 缓存格式化结果
6. **改进字符位置计算** - 使用 canvas 测量

### 🟢 低优先级
7. **添加单元测试** - 测试格式化逻辑
8. **添加注释** - 复杂正则表达式需要说明
9. **类型安全** - 更严格的 TypeScript 类型

---

## 📝 重构示例

### 示例 1: 拆分工具栏组件
```typescript
// components/editor/NodeToolbar.tsx
interface NodeToolbarProps {
  position: { x: number; y: number };
  onAddChild: () => void;
  onAddSibling: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function NodeToolbar({ position, ...handlers }: NodeToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
      }}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
    >
      {/* 工具栏按钮 */}
    </div>
  );
}

// OutlineNode.tsx 中使用
{showToolbar && !showFormatToolbar && (
  <NodeToolbar
    position={toolbarPosition}
    onAddChild={handleAddChild}
    onAddSibling={handleAddSibling}
    // ...
  />
)}
```

### 示例 2: 提取格式化 hook
```typescript
// hooks/useNodeFormatting.ts
export function useNodeFormatting(nodeId: string, content: string) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  const updateContent = useEditorStore(s => s.updateContent);

  const formattedContent = useMemo(() => {
    return renderFormattedText(content);
  }, [content]);

  const applyFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    if (!selectedRange) return;

    const { start, end } = selectedRange;
    const before = content.substring(0, start);
    const selected = content.substring(start, end);
    const after = content.substring(end);

    let formatted = '';
    switch (format) {
      case 'bold':
        formatted = `${before}**${selected}**${after}`;
        break;
      // ...
    }

    updateContent(nodeId, formatted);
    setShowToolbar(false);
  }, [content, selectedRange, nodeId, updateContent]);

  return {
    formattedContent,
    showToolbar,
    setShowToolbar,
    selectedRange,
    setSelectedRange,
    applyFormat,
  };
}
```

---

## 总结

OutlineNode.tsx 整体上**基本符合规范**，但在以下方面需要改进：

1. **组件过大** - 应拆分成多个小组件
2. **安全风险** - dangerouslySetInnerHTML 需要添加 XSS 防护
3. **DOM 操作** - 避免直接使用 document.querySelector
4. **性能优化** - 添加 useMemo 缓存计算结果

建议按优先级逐步重构，提高代码质量和可维护性。

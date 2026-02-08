# 🎯 统一工具栏重构 - 彻底解决多工具栏问题

## 😤 问题总结

从截图和反馈中发现的问题：

1. ❌ **多个工具栏同时显示** - 3个格式工具栏同时出现
2. ❌ **工具栏距离太远** - 难以点击
3. ❌ **没有2秒停留时间** - 格式工具栏立即消失
4. ❌ **逻辑不统一** - 操作工具栏和格式工具栏使用不同的代码

---

## ✅ 解决方案：统一工具栏架构

### 核心思想

**用同一套代码控制两个工具栏，只改变显示内容！**

```
统一工具栏系统
    ├─ 统一的显示逻辑
    ├─ 统一的位置控制
    ├─ 统一的定时器管理
    └─ 根据类型切换内容
        ├─ operation: 操作按钮
        └─ format: 格式按钮
```

---

## 📁 新增文件

### 1. `components/editor/UnifiedToolbar.tsx`

**统一工具栏组件** - 两种工具栏使用相同的UI容器

```typescript
export function UnifiedToolbar({ 
  type,           // 'operation' | 'format'
  position,       // { x, y }
  onMouseEnter,   // 鼠标进入
  onMouseLeave,   // 鼠标离开
  children        // 工具栏内容
}: UnifiedToolbarProps)
```

**特点**：
- ✅ 统一的样式
- ✅ 统一的动画
- ✅ 统一的定位逻辑
- ✅ 根据 `type` 区分工具栏类型

---

### 2. `hooks/useUnifiedToolbar.ts`

**统一工具栏 Hook** - 控制工具栏的显示、隐藏、定时器

```typescript
const {
  toolbarType,           // 当前工具栏类型: 'operation' | 'format' | null
  position,              // 工具栏位置
  showOperationToolbar,  // 显示操作工具栏
  showFormatToolbar,     // 显示格式工具栏
  delayedHide,           // 延迟隐藏
  cancelHide,            // 取消隐藏
  updatePosition,        // 更新位置
} = useUnifiedToolbar(nodeId);
```

**核心逻辑**：

#### 显示操作工具栏
```typescript
const showOperationToolbar = (x: number, y: number) => {
  clearAllTimeouts();
  setPosition({ x, y: y + 5 }); // 紧贴鼠标 5px
  setToolbarType('operation');
  setActiveToolbarNodeId(nodeId);
};
```

#### 显示格式工具栏
```typescript
const showFormatToolbar = (x: number, y: number) => {
  clearAllTimeouts();
  setPosition({ x, y: y + 5 }); // 紧贴鼠标 5px
  setToolbarType('format');
  setActiveToolbarNodeId(nodeId);
  
  // 2秒后自动关闭 ✅
  timeoutRef.current = setTimeout(() => {
    hideToolbar();
  }, 2000);
};
```

#### 全局唯一性保证
```typescript
// 只有当前节点是激活节点时才显示工具栏
const isActive = activeToolbarNodeId === nodeId;

// 如果不是激活节点，隐藏工具栏
useEffect(() => {
  if (!isActive) {
    setToolbarType(null);
  }
}, [isActive]);
```

---

### 3. `components/editor/OutlineNode.tsx` (重构)

**使用统一工具栏的节点组件**

#### 初始化
```typescript
// 使用统一工具栏 Hook
const {
  toolbarType,
  position,
  showOperationToolbar,
  showFormatToolbar,
  delayedHide,
  cancelHide,
  updatePosition,
} = useUnifiedToolbar(nodeId);
```

#### 悬停显示操作工具栏
```typescript
const handleMouseEnter = (e: React.MouseEvent) => {
  if (toolbarType === 'format') return; // 格式工具栏显示时不触发

  hoverTimeoutRef.current = setTimeout(() => {
    showOperationToolbar(e.clientX, e.clientY);
  }, 1000);
};
```

#### 选中文字显示格式工具栏
```typescript
const handleTextSelectWrapper = (e: React.MouseEvent) => {
  const input = inputRef.current;
  if (!input) return;

  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;

  if (start !== end) {
    const nativeEvent = (e as any)?.nativeEvent as MouseEvent;
    const x = nativeEvent?.clientX || input.getBoundingClientRect().left;
    const y = nativeEvent?.clientY || input.getBoundingClientRect().bottom;
    
    showFormatToolbar(x, y); // 显示格式工具栏
  }
};
```

#### 渲染统一工具栏
```typescript
{toolbarType && (
  <UnifiedToolbar
    type={toolbarType}
    position={position}
    onMouseEnter={cancelHide}
    onMouseLeave={() => delayedHide(toolbarType === 'format' ? 1000 : 500)}
  >
    {toolbarType === 'operation' ? (
      // 操作按钮
      <>
        <button onClick={() => addChildNode(nodeId)}>+</button>
        <button onClick={() => indentNode(nodeId)}>→</button>
        ...
      </>
    ) : (
      // 格式按钮
      <>
        <button onClick={() => applyFormat('bold')}>B</button>
        <button onClick={() => applyFormat('italic')}>I</button>
        ...
      </>
    )}
  </UnifiedToolbar>
)}
```

---

## 🎯 核心优势

### 1. 全局唯一性 ✅

```typescript
// 使用全局状态确保只有一个工具栏
const activeToolbarNodeId = useEditorStore(s => s.activeToolbarNodeId);

// 只有激活节点才显示工具栏
const isActive = activeToolbarNodeId === nodeId;
const toolbarType = isActive ? toolbarType : null;
```

**效果**：
- ✅ 同一时间只有一个节点的工具栏显示
- ✅ 切换节点时自动隐藏旧工具栏
- ✅ 不会出现多个工具栏

---

### 2. 统一的定时器管理 ✅

```typescript
const clearAllTimeouts = () => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

// 每次显示工具栏前清理所有定时器
const showOperationToolbar = (x, y) => {
  clearAllTimeouts(); // ✅ 清理旧定时器
  // ...
};

const showFormatToolbar = (x, y) => {
  clearAllTimeouts(); // ✅ 清理旧定时器
  // ...
  setTimeout(() => hideToolbar(), 2000); // ✅ 2秒后关闭
};
```

**效果**：
- ✅ 格式工具栏 2 秒后自动关闭
- ✅ 鼠标进入时取消关闭
- ✅ 鼠标离开时延迟关闭
- ✅ 不会有定时器冲突

---

### 3. 统一的位置控制 ✅

```typescript
// 紧贴鼠标 5px
setPosition({ x, y: y + 5 });

// 跟随鼠标移动（仅操作工具栏）
const updatePosition = (x: number, y: number) => {
  if (isActive && toolbarType === 'operation') {
    setPosition({ x, y: y + 5 });
  }
};
```

**效果**：
- ✅ 工具栏紧贴鼠标（5px）
- ✅ 操作工具栏跟随鼠标移动
- ✅ 格式工具栏固定在选中位置
- ✅ 两个工具栏高度一致

---

### 4. 统一的交互逻辑 ✅

```typescript
// 鼠标进入 - 取消隐藏
onMouseEnter={cancelHide}

// 鼠标离开 - 延迟隐藏
onMouseLeave={() => delayedHide(
  toolbarType === 'format' ? 1000 : 500  // 格式1秒，操作500ms
)}
```

**效果**：
- ✅ 鼠标悬停时工具栏保持显示
- ✅ 鼠标离开后延迟关闭
- ✅ 有足够时间移动鼠标点击

---

## 📊 问题对比

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| 多个工具栏同时显示 | ❌ 3个同时出现 | ✅ 只显示1个 |
| 工具栏距离 | ❌ 20px 太远 | ✅ 5px 紧贴 |
| 格式工具栏停留时间 | ❌ 立即消失 | ✅ 2秒后消失 |
| 代码逻辑 | ❌ 两套代码 | ✅ 统一逻辑 |
| 定时器管理 | ❌ 混乱 | ✅ 统一管理 |
| 位置控制 | ❌ 不一致 | ✅ 统一控制 |
| 可维护性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎬 工作流程

### 操作工具栏流程
```
鼠标悬停节点 1 秒
    ↓
显示操作工具栏（紧贴鼠标 5px）
    ↓
跟随鼠标移动
    ↓
鼠标离开节点
    ↓
500ms 后关闭
    ↓
如果鼠标进入工具栏：
├─ 取消关闭
└─ 鼠标离开后 500ms 关闭
```

### 格式工具栏流程
```
选中文字
    ↓
显示格式工具栏（紧贴鼠标 5px）
    ↓
固定在选中位置
    ↓
2 秒后自动关闭 ✅
    ↓
如果鼠标进入工具栏：
├─ 取消关闭
└─ 鼠标离开后 1 秒关闭
```

### 工具栏切换流程
```
操作工具栏显示
    ↓
用户选中文字
    ↓
clearAllTimeouts() - 清理旧定时器
    ↓
操作工具栏消失
    ↓
格式工具栏出现（同一位置）
    ↓
平滑过渡，无跳动 ✅
```

---

## 🔧 技术细节

### 全局状态管理
```typescript
// lib/store.ts
activeToolbarNodeId: string | null  // 当前激活的工具栏节点ID
```

### 类型定义
```typescript
export type ToolbarType = 'operation' | 'format' | null;
```

### 定时器引用
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### 位置状态
```typescript
const [position, setPosition] = useState({ x: 0, y: 0 });
```

---

## ✅ 验收标准

### 1. 全局唯一性
- ✅ 同一时间只显示一个工具栏
- ✅ 切换节点时自动切换工具栏
- ✅ 不会出现多个工具栏

### 2. 格式工具栏
- ✅ 选中文字后显示
- ✅ 2 秒后自动关闭
- ✅ 鼠标悬停时保持显示
- ✅ 鼠标离开后 1 秒关闭

### 3. 操作工具栏
- ✅ 悬停 1 秒后显示
- ✅ 跟随鼠标移动
- ✅ 鼠标离开后 500ms 关闭
- ✅ 鼠标悬停时保持显示

### 4. 位置和距离
- ✅ 紧贴鼠标 5px
- ✅ 水平居中
- ✅ 两个工具栏高度一致
- ✅ 切换时无跳动

### 5. 代码质量
- ✅ 统一的逻辑
- ✅ 易于维护
- ✅ 类型安全
- ✅ 清晰的注释

---

## 📝 修改的文件

### 新增文件
1. ✅ `components/editor/UnifiedToolbar.tsx` - 统一工具栏组件
2. ✅ `hooks/useUnifiedToolbar.ts` - 统一工具栏 Hook

### 重构文件
3. ✅ `components/editor/OutlineNode.tsx` - 使用统一工具栏

### 备份文件
4. 📦 `components/editor/OutlineNode_OLD.tsx` - 旧版本备份

---

## 🎉 总结

### 核心改进

1. **统一架构** - 一套代码控制两个工具栏
2. **全局唯一** - 同一时间只显示一个工具栏
3. **定时器管理** - 统一的定时器逻辑，格式工具栏 2 秒后关闭
4. **位置控制** - 紧贴鼠标 5px，高度一致
5. **代码质量** - 易于维护和扩展

### 用户体验

- ✅ 不会出现多个工具栏
- ✅ 工具栏紧贴鼠标，容易点击
- ✅ 格式工具栏有足够的停留时间（2秒）
- ✅ 平滑的过渡动画
- ✅ 智能的交互逻辑

---

**重构完成！** 🎊

现在工具栏：
- ✅ 只显示一个
- ✅ 紧贴鼠标（5px）
- ✅ 格式工具栏停留 2 秒
- ✅ 使用统一的逻辑
- ✅ 代码简洁易维护


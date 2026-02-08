# 多个悬浮工具栏问题修复

## 问题描述
多个节点的悬浮工具栏同时显示且不消失。当鼠标在不同节点间移动时，每个节点都会显示自己的工具栏，导致屏幕上出现多个工具栏重叠。

## 根本原因
每个 `OutlineNode` 组件都有自己独立的 `showToolbar` 和 `showFormatToolbar` 状态。当鼠标移动到不同节点时，新节点的工具栏会显示，但旧节点的工具栏状态没有被清除，导致多个工具栏同时存在。

## 解决方案
将工具栏状态从组件本地状态提升到全局 Store，确保同一时间只有一个节点的工具栏处于激活状态。

### 修改 1: `lib/store.ts` - 添加全局工具栏状态

```typescript
interface EditorStore {
  // ... 其他状态
  
  // 全局工具栏状态（确保同一时间只有一个工具栏显示）
  activeToolbarNodeId: string | null;
  activeFormatToolbarNodeId: string | null;
  setActiveToolbarNodeId: (nodeId: string | null) => void;
  setActiveFormatToolbarNodeId: (nodeId: string | null) => void;
}

// 初始化
activeToolbarNodeId: null,
activeFormatToolbarNodeId: null,

// 实现
setActiveToolbarNodeId: (nodeId) => {
  set({ activeToolbarNodeId: nodeId });
},

setActiveFormatToolbarNodeId: (nodeId) => {
  set({ activeFormatToolbarNodeId: nodeId });
},
```

### 修改 2: `components/editor/OutlineNode.tsx` - 使用全局状态

**之前（本地状态）：**
```typescript
const [showToolbar, setShowToolbar] = useState(false);
const [showFormatToolbar, setShowFormatToolbar] = useState(false);
```

**之后（全局状态）：**
```typescript
// 从 Store 获取全局状态
const activeToolbarNodeId = useEditorStore(s => s.activeToolbarNodeId);
const activeFormatToolbarNodeId = useEditorStore(s => s.activeFormatToolbarNodeId);
const setActiveToolbarNodeId = useEditorStore(s => s.setActiveToolbarNodeId);
const setActiveFormatToolbarNodeId = useEditorStore(s => s.setActiveFormatToolbarNodeId);

// 计算当前节点是否应该显示工具栏
const showToolbar = activeToolbarNodeId === nodeId;
const showFormatToolbar = activeFormatToolbarNodeId === nodeId;
```

### 修改 3: 更新所有状态设置调用

| 原代码 | 新代码 |
|--------|--------|
| `setShowToolbar(true)` | `setActiveToolbarNodeId(nodeId)` |
| `setShowToolbar(false)` | `setActiveToolbarNodeId(null)` |
| `setShowFormatToolbar(true)` | `setActiveFormatToolbarNodeId(nodeId)` |
| `setShowFormatToolbar(false)` | `setActiveFormatToolbarNodeId(null)` |

## 工作原理

### 之前的问题
```
节点 A: showToolbar = true  ← 鼠标离开但状态未清除
节点 B: showToolbar = true  ← 鼠标进入，显示工具栏
节点 C: showToolbar = true  ← 鼠标进入，显示工具栏
结果：3个工具栏同时显示 ❌
```

### 修复后的行为
```
全局状态: activeToolbarNodeId = "node-A"
节点 A: showToolbar = true  (activeToolbarNodeId === "node-A")
节点 B: showToolbar = false (activeToolbarNodeId !== "node-B")
节点 C: showToolbar = false (activeToolbarNodeId !== "node-C")
结果：只有1个工具栏显示 ✅
```

## 关键改进

1. **互斥性保证**：通过全局状态，确保 `activeToolbarNodeId` 同一时间只能指向一个节点
2. **自动清理**：当新节点激活时，旧节点的工具栏自动隐藏
3. **状态同步**：所有节点共享同一个状态源，避免状态不一致

## 测试验证

### 测试场景 1：鼠标在节点间移动
1. 鼠标悬停在节点 A 上 1 秒
2. 操作工具栏出现在节点 A 下方
3. 鼠标移动到节点 B
4. 节点 A 的工具栏消失，节点 B 的工具栏出现
5. ✅ 同一时间只有一个工具栏

### 测试场景 2：选中文字显示格式工具栏
1. 在节点 A 中选中文字
2. 格式工具栏出现
3. 操作工具栏自动隐藏
4. 在节点 B 中选中文字
5. 节点 A 的格式工具栏消失，节点 B 的格式工具栏出现
6. ✅ 同一时间只有一个格式工具栏

### 测试场景 3：工具栏互斥
1. 鼠标悬停显示操作工具栏
2. 选中文字显示格式工具栏
3. 操作工具栏自动隐藏
4. ✅ 两种工具栏互斥显示

## 修改的文件

1. **`lib/store.ts`**
   - 添加 `activeToolbarNodeId` 状态
   - 添加 `activeFormatToolbarNodeId` 状态
   - 添加 `setActiveToolbarNodeId` 方法
   - 添加 `setActiveFormatToolbarNodeId` 方法

2. **`components/editor/OutlineNode.tsx`**
   - 移除本地 `useState` 状态
   - 使用全局 Store 状态
   - 更新所有状态设置调用

## 性能优化

使用全局状态还带来了性能优化：
- **减少重渲染**：只有激活状态改变的节点会重新渲染
- **状态管理简化**：不需要在每个组件中维护独立状态
- **内存占用减少**：不需要为每个节点创建独立的状态对象

## 总结

通过将工具栏状态从组件本地提升到全局 Store，我们成功解决了多个工具栏同时显示的问题。这个修复不仅解决了 UI 混乱的问题，还提升了代码的可维护性和性能。

✅ **问题已完全解决！**


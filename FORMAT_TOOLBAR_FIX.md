# 🔧 格式工具栏功能修复

## 🐛 问题

用户报告：**选中文字后，格式工具栏的按钮（下划线、粗体、斜体、高亮）都不工作！**

---

## 🔍 根本原因

在重构为统一工具栏后，**选区信息没有被存储**，导致 `applyFormat` 函数无法获取选中的文本范围。

### 问题代码

```typescript
// ❌ 旧的 handleTextSelectWrapper - 没有存储选区
const handleTextSelectWrapper = (e: React.MouseEvent) => {
  const input = inputRef.current;
  if (!input) return;

  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;

  if (start !== end) {
    // 只显示工具栏，但没有存储选区信息！
    showFormatToolbar(x, y);
  }
};
```

```typescript
// ❌ applyFormat 无法获取选区
const applyFormat = (format: 'bold' | 'italic' | 'underline' | 'highlight') => {
  // selectionRange 是 null！
  if (!selectionRange || !node) return;
  // ...
};
```

---

## ✅ 解决方案

### 1. 修改 `useNodeFormatting` Hook

使用 `useRef` 存储选区信息，而不是 `useState`：

```typescript
export function useNodeFormatting(nodeId: string) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);

  // ✅ 使用 ref 存储选区信息
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null);

  // ✅ 存储选区的函数
  const storeSelection = useCallback((input: HTMLInputElement) => {
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      selectionRangeRef.current = { start, end };
    }
  }, []);

  // ✅ 应用格式时从 ref 读取选区
  const applyFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    const selectionRange = selectionRangeRef.current;
    if (!selectionRange || !node) return;

    const { start, end } = selectionRange;
    const before = node.content.substring(0, start);
    const selected = node.content.substring(start, end);
    const after = node.content.substring(end);

    let formatted = '';
    switch (format) {
      case 'bold':
        formatted = `${before}**${selected}**${after}`;
        break;
      case 'italic':
        formatted = `${before}*${selected}*${after}`;
        break;
      case 'underline':
        formatted = `${before}<u>${selected}</u>${after}`;
        break;
      case 'highlight':
        formatted = `${before}==${selected}==${after}`;
        break;
    }

    updateContent(nodeId, formatted);
    
    // 清理选区
    selectionRangeRef.current = null;
  }, [node, nodeId, updateContent]);

  return {
    renderFormattedText,
    storeSelection,  // ✅ 导出存储函数
    applyFormat,
  };
}
```

---

### 2. 修改 `OutlineNode` 组件

在选中文字时调用 `storeSelection`：

```typescript
// ✅ 导入 storeSelection
const { renderFormattedText, storeSelection, applyFormat } = useNodeFormatting(nodeId);

// ✅ 选中文字时存储选区
const handleTextSelectWrapper = (e: React.MouseEvent | React.SyntheticEvent) => {
  const input = inputRef.current;
  if (!input) return;

  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;

  if (start !== end) {
    // ✅ 存储选区信息 - 这样 applyFormat 才能工作！
    storeSelection(input);
    
    // 获取鼠标位置
    const nativeEvent = (e as any)?.nativeEvent as MouseEvent;
    const x = nativeEvent?.clientX || input.getBoundingClientRect().left;
    const y = nativeEvent?.clientY || input.getBoundingClientRect().bottom;
    
    showFormatToolbar(x, y);
  }
};
```

---

## 🎯 工作流程

### 修复前 ❌

```
用户选中文字
    ↓
显示格式工具栏
    ↓
用户点击"粗体"按钮
    ↓
applyFormat('bold') 被调用
    ↓
selectionRange 是 null ❌
    ↓
函数直接返回，什么都不做
    ↓
文字没有变化 ❌
```

### 修复后 ✅

```
用户选中文字
    ↓
storeSelection(input) 存储选区 ✅
    ↓
显示格式工具栏
    ↓
用户点击"粗体"按钮
    ↓
applyFormat('bold') 被调用
    ↓
从 selectionRangeRef.current 读取选区 ✅
    ↓
应用格式：**选中的文字** ✅
    ↓
更新节点内容 ✅
    ↓
文字变粗体！🎉
```

---

## 📊 格式化效果

| 格式 | Markdown 语法 | 效果 |
|------|--------------|------|
| 粗体 | `**文字**` | **文字** |
| 斜体 | `*文字*` | *文字* |
| 下划线 | `<u>文字</u>` | <u>文字</u> |
| 高亮 | `==文字==` | ==文字== |

---

## 🔧 技术细节

### 为什么使用 `useRef` 而不是 `useState`？

1. **性能** - `useRef` 不会触发重新渲染
2. **即时性** - 值立即可用，不需要等待下一次渲染
3. **简单性** - 不需要管理状态更新

### 选区存储时机

```typescript
// 在两个事件中都调用
onSelect={handleTextSelectWrapper}   // 键盘选择
onMouseUp={handleTextSelectWrapper}  // 鼠标选择
```

### 选区清理

```typescript
// 应用格式后清理选区
updateContent(nodeId, formatted);
selectionRangeRef.current = null;  // ✅ 防止重复应用
```

---

## ✅ 验收标准

### 测试场景 1：粗体
1. 选中文字 "测试" ✅
2. 点击 B 按钮 ✅
3. 文字变为 `**测试**` ✅
4. 渲染为粗体 ✅

### 测试场景 2：斜体
1. 选中文字 "测试" ✅
2. 点击 I 按钮 ✅
3. 文字变为 `*测试*` ✅
4. 渲染为斜体 ✅

### 测试场景 3：下划线
1. 选中文字 "测试" ✅
2. 点击 U 按钮 ✅
3. 文字变为 `<u>测试</u>` ✅
4. 渲染为下划线 ✅

### 测试场景 4：高亮
1. 选中文字 "测试" ✅
2. 点击 H 按钮 ✅
3. 文字变为 `==测试==` ✅
4. 渲染为高亮 ✅

### 测试场景 5：组合格式
1. 选中 "测试"，点击 B → `**测试**` ✅
2. 选中 "**测试**"，点击 I → `***测试***` ✅
3. 渲染为粗斜体 ✅

---

## 📝 修改的文件

### 1. `hooks/useNodeFormatting.ts`
- ✅ 使用 `useRef` 存储选区
- ✅ 添加 `storeSelection` 函数
- ✅ 简化 Hook 接口

### 2. `components/editor/OutlineNode.tsx`
- ✅ 导入 `storeSelection`
- ✅ 在 `handleTextSelectWrapper` 中调用 `storeSelection`
- ✅ 确保格式按钮正确调用 `applyFormat`

---

## 🎉 总结

### 问题
- ❌ 格式工具栏按钮不工作
- ❌ 选区信息没有被存储
- ❌ `applyFormat` 无法获取选中的文本

### 解决
- ✅ 使用 `useRef` 存储选区信息
- ✅ 在选中文字时调用 `storeSelection`
- ✅ `applyFormat` 从 ref 读取选区
- ✅ 所有格式按钮正常工作

### 效果
- ✅ 粗体 (**文字**)
- ✅ 斜体 (*文字*)
- ✅ 下划线 (<u>文字</u>)
- ✅ 高亮 (==文字==)

---

**修复完成！** 🎊

现在格式工具栏的所有按钮都能正常工作了！

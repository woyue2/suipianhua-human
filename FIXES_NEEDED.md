# 待修复问题总结

## 🔧 需要修复的问题

### 1. **Ctrl+Z 撤销功能不工作**

**问题**：
- Store 中有 undo/redo 功能，但没有自动保存历史记录
- 每次内容更新时需要调用 `pushHistory`

**解决方案**：
```typescript
// 在 updateNodeContent 中添加
updateNodeContent: (id, content) => {
  set(state => {
    if (state.nodes[id]) {
      state.nodes[id].content = content;
      state.nodes[id].updatedAt = Date.now();
    }
  });
  
  // 延迟保存历史，避免每次输入都保存
  setTimeout(() => {
    const doc = get().buildDocumentTree();
    get().pushHistory(doc);
  }, 500);
},
```

---

### 2. **格式化文本没有被渲染**

**问题**：
- 应用格式后（如 `**粗体**`），文本只显示标记，没有实际渲染效果
- 需要将 Markdown 格式转换为 HTML 显示

**解决方案**：
- 使用 `contentEditable` div 替代 input
- 或者在显示时渲染 Markdown
- 使用 `dangerouslySetInnerHTML` 显示格式化后的 HTML

**示例**：
```typescript
// 渲染函数
const renderFormatted = (text: string) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-200">$1</mark>');
};

// 使用
<div dangerouslySetInnerHTML={{ __html: renderFormatted(node.content) }} />
```

---

### 3. **两个工具栏冲突**

**问题**：
- 格式化工具栏和操作工具栏同时出现
- 用户体验混乱

**解决方案**：
```typescript
// 在 OutlineNode 中
const [showToolbar, setShowToolbar] = useState(false);
const [showFormatToolbar, setShowFormatToolbar] = useState(false);

// 当格式工具栏出现时，隐藏操作工具栏
useEffect(() => {
  if (showFormatToolbar) {
    setShowToolbar(false);
  }
}, [showFormatToolbar]);

// 或者在鼠标选择时
const handleTextSelect = () => {
  if (hasSelection) {
    setShowFormatToolbar(true);
    setShowToolbar(false); // 隐藏操作工具栏
  }
};
```

---

### 4. **添加只读/编辑模式切换**

**问题**：
- 缺少只读模式
- 需要在 Header 添加切换按钮

**解决方案**：

#### Store 添加状态
```typescript
interface EditorStore {
  isReadOnly: boolean;
  toggleReadOnly: () => void;
}

// 实现
isReadOnly: false,
toggleReadOnly: () => {
  set(state => {
    state.isReadOnly = !state.isReadOnly;
  });
},
```

#### Header 添加按钮
```typescript
import { Eye, Edit3 } from 'lucide-react';

const isReadOnly = useEditorStore(s => s.isReadOnly);
const toggleReadOnly = useEditorStore(s => s.toggleReadOnly);

<button 
  onClick={toggleReadOnly}
  className={`p-1 px-2 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm flex items-center gap-1 transition-all
    ${isReadOnly ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}
  title={isReadOnly ? '切换到编辑模式' : '切换到只读模式'}
>
  {isReadOnly ? <Eye size={16} /> : <Edit3 size={16} />}
</button>
```

#### OutlineNode 禁用编辑
```typescript
const isReadOnly = useEditorStore(s => s.isReadOnly);

<input
  disabled={isReadOnly}
  readOnly={isReadOnly}
  className={`... ${isReadOnly ? 'cursor-default' : ''}`}
/>

// 隐藏工具栏
{!isReadOnly && showToolbar && (
  <div>...</div>
)}
```

---

### 5. **标签设计**

**当前问题**：
- `#重点` 标签的设计和管理不明确

**建议方案**：

#### 方案 A：自动标签
- 用户输入 `#标签名` 自动识别为标签
- 显示为彩色徽章

#### 方案 B：手动添加
- 右键菜单或工具栏添加标签
- 可以选择预设标签或自定义

#### 方案 C：Markdown 风格
- 使用 `#重点` 语法
- 渲染时转换为徽章显示

**推荐实现**（方案 C）：
```typescript
// 解析标签
const parseTags = (content: string) => {
  const tagRegex = /#(\S+)/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return tags;
};

// 渲染时移除标签文本，单独显示
const contentWithoutTags = content.replace(/#\S+/g, '').trim();
const tags = parseTags(content);
```

---

## 📋 实现优先级

### 高优先级（立即修复）
1. ✅ 两个工具栏冲突 - 简单修复
2. ✅ 添加只读/编辑模式 - 用户需求
3. ⚠️ 格式化文本渲染 - 核心功能

### 中优先级（尽快实现）
4. ⚠️ Ctrl+Z 撤销功能 - 需要测试
5. ⚠️ 标签设计 - 需要讨论方案

---

## 🚀 快速修复步骤

### 步骤 1：修复工具栏冲突
在 `OutlineNode.tsx` 中：
```typescript
// 选中文字时隐藏操作工具栏
const handleTextSelect = () => {
  // ... 现有代码
  if (start !== end) {
    setShowFormatToolbar(true);
    setShowToolbar(false); // 添加这行
  }
};
```

### 步骤 2：添加只读模式
1. 修改 `lib/store.ts` 添加 `isReadOnly` 状态
2. 修改 `components/editor/Header.tsx` 添加切换按钮
3. 修改 `components/editor/OutlineNode.tsx` 禁用编辑

### 步骤 3：渲染格式化文本
将 input 改为 contentEditable div，或添加预览模式

---

## 💡 建议

1. **撤销功能**：考虑使用防抖，避免每次输入都保存历史
2. **格式渲染**：可以添加"预览模式"和"编辑模式"切换
3. **标签系统**：建议使用 Markdown 风格，简单直观
4. **只读模式**：可以隐藏所有编辑工具，只显示内容

---

## 🎯 下一步行动

请确认：
1. 是否立即修复工具栏冲突？
2. 是否添加只读/编辑模式切换？
3. 格式化文本渲染方案：使用 contentEditable 还是预览模式？
4. 标签设计方案：选择哪个方案？


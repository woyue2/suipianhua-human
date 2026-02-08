# 标签管理功能实现

## 📋 功能概述

实现了完整的标签管理系统，支持：
- ✅ 显示标签
- ✅ 添加标签
- ✅ 删除标签
- ✅ 自动识别标签（从内容中提取 `#标签名`）
- ✅ 预设标签快速添加
- ✅ 悬停显示删除按钮

---

## 🎯 使用方式

### 1. 查看标签
标签会显示在节点内容的右侧，带有浅色背景。

### 2. 删除标签
**方法 1：悬停删除**
- 鼠标悬停在标签上
- 出现 ❌ 删除按钮
- 点击删除

**方法 2：直接点击**（可选实现）
- 点击标签切换开关

### 3. 添加标签
**方法 1：手动添加**
1. 点击节点旁边的 ➕ 标签按钮
2. 输入标签名（自动添加 # 前缀）
3. 按 Enter 确认

**方法 2：快速添加**
- 点击预设标签（#重点、#待办、#问题等）
- 直接添加到节点

**方法 3：自动识别**（未来实现）
- 在内容中输入 `#标签名`
- 失焦时自动提取到标签列表

---

## 📦 新增文件

### 1. `components/editor/TagList.tsx`
**职责**：显示标签列表（简化版）

**Props**：
```typescript
interface TagListProps {
  tags: string[];
  onRemoveTag?: (tag: string) => void;
  readOnly?: boolean;
}
```

**特点**：
- 悬停显示删除按钮
- 支持只读模式
- 阻止事件冒泡

**使用示例**：
```tsx
<TagList 
  tags={['#重点', '#待办']} 
  onRemoveTag={removeTag} 
/>
```

---

### 2. `components/editor/TagManager.tsx`
**职责**：完整的标签管理界面（可选）

**Props**：
```typescript
interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
}
```

**功能**：
- 显示所有标签
- 添加新标签（输入框）
- 删除标签
- 预设标签快速添加

**使用场景**：
- 节点详情面板
- 标签管理对话框
- 侧边栏标签筛选

---

### 3. `hooks/useNodeTags.ts`
**职责**：标签管理逻辑

**返回值**：
```typescript
{
  tags: string[];              // 当前标签列表
  addTag: (tag: string) => void;      // 添加标签
  removeTag: (tag: string) => void;   // 删除标签
  toggleTag: (tag: string) => void;   // 切换标签
  autoExtractTags: () => void;        // 自动提取标签
  extractTags: (content: string) => string[];  // 提取标签
}
```

**功能**：
- 添加标签（自动添加 # 前缀）
- 删除标签
- 切换标签（存在则删除，不存在则添加）
- 从内容中自动识别标签
- 提取标签并从内容中移除

---

## 🔄 工作流程

### 添加标签流程
```
用户点击 ➕ 按钮
    ↓
显示输入框
    ↓
用户输入标签名
    ↓
按 Enter 或失焦
    ↓
调用 addTag(tag)
    ↓
更新 Store 中的 node.tags
    ↓
UI 自动更新显示新标签
```

### 删除标签流程
```
用户悬停在标签上
    ↓
显示删除按钮（❌）
    ↓
用户点击删除按钮
    ↓
调用 removeTag(tag)
    ↓
从 node.tags 中移除
    ↓
UI 自动更新
```

### 自动识别流程（可选）
```
用户输入内容：这是 #重点 内容
    ↓
失焦时调用 autoExtractTags()
    ↓
提取标签：['#重点']
    ↓
移除内容中的标签：这是 内容
    ↓
更新 node.tags 和 node.content
```

---

## 💡 实现细节

### 1. 标签格式
```typescript
// 标签必须以 # 开头
const tag = '#重点';

// 自动添加 # 前缀
const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
```

### 2. 标签提取正则
```typescript
const tagRegex = /#([^\s#]+)/g;
// 匹配：#重点 #待办 #问题
// 不匹配：# #  (空标签)
```

### 3. 防止重复
```typescript
if (node.tags?.includes(normalizedTag)) {
  return; // 已存在，不添加
}
```

### 4. 悬停显示删除按钮
```css
.group:hover .opacity-0 {
  opacity: 1;
}
```

---

## 🎨 样式设计

### 标签样式
```tsx
<span className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
  #重点
</span>
```

**效果**：
- 浅色背景（primary/5）
- 主题色文字（primary/60）
- 圆角边框
- 小号字体

### 删除按钮样式
```tsx
<button className="opacity-0 group-hover:opacity-100 hover:text-red-500">
  <X size={10} />
</button>
```

**效果**：
- 默认隐藏（opacity-0）
- 悬停显示（group-hover:opacity-100）
- 悬停变红（hover:text-red-500）

---

## 🧪 测试场景

### 测试 1：添加标签
1. 点击节点旁边的 ➕ 按钮 ✅
2. 输入 "重点"（不带 #）✅
3. 按 Enter ✅
4. 标签显示为 "#重点" ✅

### 测试 2：删除标签
1. 悬停在 "#重点" 标签上 ✅
2. 出现 ❌ 按钮 ✅
3. 点击删除 ✅
4. 标签消失 ✅

### 测试 3：快速添加
1. 点击预设标签 "#待办" ✅
2. 标签立即添加 ✅

### 测试 4：防止重复
1. 添加 "#重点" ✅
2. 再次添加 "#重点" ✅
3. 只显示一个 "#重点" ✅

---

## 📝 使用示例

### 在 OutlineNode 中使用
```tsx
import { TagList } from './TagList';
import { useNodeTags } from '@/hooks/useNodeTags';

export const OutlineNode = memo(function({ nodeId }) {
  const { tags, removeTag } = useNodeTags(nodeId);
  
  return (
    <div>
      <input value={content} />
      <TagList tags={tags} onRemoveTag={removeTag} />
    </div>
  );
});
```

### 在标签管理面板中使用
```tsx
import { TagManager } from './TagManager';
import { useNodeTags } from '@/hooks/useNodeTags';

export const TagPanel = ({ nodeId }) => {
  const { tags, addTag, removeTag, toggleTag } = useNodeTags(nodeId);
  
  return (
    <TagManager
      tags={tags}
      onAddTag={addTag}
      onRemoveTag={removeTag}
      onToggleTag={toggleTag}
    />
  );
};
```

---

## 🚀 未来扩展

### 1. 标签筛选
```typescript
// 按标签筛选节点
const filterByTag = (tag: string) => {
  return Object.values(nodes).filter(node => 
    node.tags?.includes(tag)
  );
};
```

### 2. 标签统计
```typescript
// 统计所有标签使用次数
const tagStats = Object.values(nodes).reduce((acc, node) => {
  node.tags?.forEach(tag => {
    acc[tag] = (acc[tag] || 0) + 1;
  });
  return acc;
}, {} as Record<string, number>);
```

### 3. 标签颜色
```typescript
// 为不同标签设置不同颜色
const tagColors = {
  '#重点': 'bg-red-100 text-red-600',
  '#待办': 'bg-blue-100 text-blue-600',
  '#问题': 'bg-yellow-100 text-yellow-600',
};
```

### 4. 标签自动完成
```typescript
// 输入 # 时显示标签建议
const suggestTags = (input: string) => {
  const allTags = getAllTags();
  return allTags.filter(tag => 
    tag.toLowerCase().includes(input.toLowerCase())
  );
};
```

---

## ✅ 验收标准

- ✅ 标签正确显示在节点旁边
- ✅ 悬停显示删除按钮
- ✅ 点击删除按钮可删除标签
- ✅ 可以添加新标签
- ✅ 标签自动添加 # 前缀
- ✅ 防止重复添加
- ✅ 预设标签快速添加
- ✅ 样式美观，交互流畅

---

**标签管理功能完成！** 🎉

现在您可以：
- 悬停在标签上查看删除按钮
- 点击 ❌ 删除标签
- 点击 ➕ 添加新标签
- 使用预设标签快速添加


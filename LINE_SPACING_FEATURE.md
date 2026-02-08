# 📏 行间距调整功能

## 🎯 功能概述

添加了一个**行间距调整按钮**，让用户可以根据个人喜好调整大纲的行间距，提升阅读体验。

---

## ✨ 功能特点

### 1. 四种行间距选项

| 选项 | 倍数 | 顶层间距 | 子节点间距 | 适用场景 |
|------|------|---------|-----------|---------|
| 紧凑 | 1.2x | mb-4 | mt-1 | 信息密集，快速浏览 |
| 正常 | 1.6x | mb-8 | mt-2 | 默认设置，平衡阅读 |
| 舒适 | 2.0x | mb-12 | mt-3 | 长时间阅读 |
| 宽松 | 2.5x | mb-16 | mt-4 | 演示、展示 |

### 2. 实时预览

- ✅ 点击选项后立即生效
- ✅ 无需刷新页面
- ✅ 平滑过渡效果

### 3. 全局设置

- ✅ 影响所有节点
- ✅ 保持在 Zustand Store 中
- ✅ 可扩展为持久化存储

---

## 🎨 UI 设计

### 触发按钮

```
┌─────────────┐
│  ☰  正常    │  ← 显示当前选项
└─────────────┘
```

### 下拉菜单

```
┌──────────────────────┐
│  行间距设置          │
├──────────────────────┤
│  ≡  紧凑    1.2x  ✓ │
│  ☰  正常    1.6x    │
│  ≣  舒适    2.0x    │
│  ≣  宽松    2.5x    │
└──────────────────────┘
```

---

## 🔧 技术实现

### 1. Store 状态管理

```typescript
// lib/store.ts
interface EditorStore {
  lineSpacing: 'compact' | 'normal' | 'relaxed' | 'loose';
  setLineSpacing: (spacing: 'compact' | 'normal' | 'relaxed' | 'loose') => void;
}

// 初始化
lineSpacing: 'normal',

// Action
setLineSpacing: (spacing) => {
  set({ lineSpacing: spacing });
  console.log('📏 Line spacing changed to:', spacing);
},
```

---

### 2. 行间距控制组件

```typescript
// components/LineSpacingControl.tsx
export function LineSpacingControl() {
  const lineSpacing = useEditorStore(s => s.lineSpacing);
  const setLineSpacing = useEditorStore(s => s.setLineSpacing);
  const [isOpen, setIsOpen] = useState(false);

  const spacingOptions = [
    { value: 'compact', label: '紧凑', icon: '≡', description: '1.2x' },
    { value: 'normal', label: '正常', icon: '☰', description: '1.6x' },
    { value: 'relaxed', label: '舒适', icon: '≣', description: '2.0x' },
    { value: 'loose', label: '宽松', icon: '≣', description: '2.5x' },
  ];

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button onClick={() => setIsOpen(!isOpen)}>
        {currentOption.icon} {currentOption.label}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2">
          {spacingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setLineSpacing(option.value);
                setIsOpen(false);
              }}
            >
              {option.icon} {option.label} {option.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 3. OutlineNode 应用行间距

```typescript
// components/editor/OutlineNode.tsx
export const OutlineNode = memo(function OutlineNode({ nodeId, depth }) {
  // 获取行间距设置
  const lineSpacing = useEditorStore(s => s.lineSpacing);

  // 获取行间距样式
  const getSpacingClass = () => {
    switch (lineSpacing) {
      case 'compact':
        return depth === 0 ? 'mb-4' : 'mt-1';
      case 'normal':
        return depth === 0 ? 'mb-8' : 'mt-2';
      case 'relaxed':
        return depth === 0 ? 'mb-12' : 'mt-3';
      case 'loose':
        return depth === 0 ? 'mb-16' : 'mt-4';
      default:
        return depth === 0 ? 'mb-8' : 'mt-2';
    }
  };

  return (
    <div className={`flex flex-col ${getSpacingClass()}`}>
      {/* 节点内容 */}
    </div>
  );
});
```

---

### 4. Header 集成

```typescript
// components/editor/Header.tsx
import { LineSpacingControl } from '@/components/LineSpacingControl';

export const Header: React.FC = () => {
  return (
    <header>
      {/* 其他按钮 */}
      
      {/* 行间距控制 */}
      <LineSpacingControl />
      
      {/* 设置按钮 */}
    </header>
  );
};
```

---

## 📊 行间距对比

### 紧凑模式 (1.2x)

```
第一章：学习的机器
  1.神经的连接
  2.知识是什么
第二章：规则和假设
  人脑的学习优势
```

### 正常模式 (1.6x) - 默认

```
第一章：学习的机器

  1.神经的连接

  2.知识是什么

第二章：规则和假设

  人脑的学习优势
```

### 舒适模式 (2.0x)

```
第一章：学习的机器


  1.神经的连接


  2.知识是什么


第二章：规则和假设


  人脑的学习优势
```

### 宽松模式 (2.5x)

```
第一章：学习的机器



  1.神经的连接



  2.知识是什么



第二章：规则和假设



  人脑的学习优势
```

---

## 🎯 使用场景

### 紧凑模式
- 📱 小屏幕设备
- 📊 信息密集的大纲
- 🔍 快速浏览和查找

### 正常模式
- 💻 日常使用
- 📝 一般笔记和文档
- ⚖️ 平衡的阅读体验

### 舒适模式
- 📖 长时间阅读
- 🎓 学习和研究
- 👀 减少视觉疲劳

### 宽松模式
- 🎤 演示和展示
- 👥 投影和分享
- 🖼️ 强调层次结构

---

## 🎨 UI 交互

### 1. 打开菜单

```
用户点击按钮
    ↓
显示下拉菜单
    ↓
显示遮罩层（点击关闭）
```

### 2. 选择选项

```
用户点击选项
    ↓
更新 Store 状态
    ↓
关闭下拉菜单
    ↓
所有节点立即应用新间距 ✅
```

### 3. 关闭菜单

```
点击遮罩层 → 关闭
点击选项 → 应用并关闭
按 ESC 键 → 关闭（可扩展）
```

---

## 🔄 状态流转

```
初始状态: lineSpacing = 'normal'
    ↓
用户点击"舒适"
    ↓
setLineSpacing('relaxed')
    ↓
Store 更新: lineSpacing = 'relaxed'
    ↓
所有 OutlineNode 重新渲染
    ↓
应用新的 spacing class
    ↓
视觉效果立即生效 ✅
```

---

## 🚀 扩展功能

### 1. 持久化存储

```typescript
// 保存到 localStorage
useEffect(() => {
  localStorage.setItem('lineSpacing', lineSpacing);
}, [lineSpacing]);

// 初始化时读取
const savedSpacing = localStorage.getItem('lineSpacing');
if (savedSpacing) {
  setLineSpacing(savedSpacing);
}
```

### 2. 自定义间距

```typescript
// 添加自定义选项
{ value: 'custom', label: '自定义', icon: '⚙️' }

// 显示滑块
<input
  type="range"
  min="1"
  max="3"
  step="0.1"
  value={customSpacing}
  onChange={(e) => setCustomSpacing(e.target.value)}
/>
```

### 3. 快捷键

```typescript
// 添加快捷键支持
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === '[') {
      // 减小间距
      decreaseSpacing();
    }
    if (e.ctrlKey && e.key === ']') {
      // 增大间距
      increaseSpacing();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 📝 修改的文件

1. ✅ `lib/store.ts`
   - 添加 `lineSpacing` 状态
   - 添加 `setLineSpacing` action

2. ✅ `components/LineSpacingControl.tsx` (新建)
   - 行间距控制组件
   - 下拉菜单 UI
   - 选项选择逻辑

3. ✅ `components/editor/OutlineNode.tsx`
   - 读取 `lineSpacing` 状态
   - 添加 `getSpacingClass()` 函数
   - 应用动态间距样式

4. ✅ `components/editor/Header.tsx`
   - 导入 `LineSpacingControl`
   - 添加到工具栏

---

## ✅ 验收标准

- ✅ 点击按钮显示下拉菜单
- ✅ 显示当前选中的选项
- ✅ 点击选项立即生效
- ✅ 所有节点应用新间距
- ✅ 点击外部关闭菜单
- ✅ 选中项显示勾选标记
- ✅ 四种间距效果明显

---

## 🎉 总结

### 功能
- ✅ 四种行间距选项（紧凑、正常、舒适、宽松）
- ✅ 实时预览和应用
- ✅ 全局设置
- ✅ 美观的下拉菜单 UI

### 用户体验
- ✅ 一键切换
- ✅ 立即生效
- ✅ 视觉反馈清晰
- ✅ 适应不同场景

### 技术实现
- ✅ Zustand 状态管理
- ✅ 响应式设计
- ✅ 可扩展架构
- ✅ 类型安全

---

**功能已完成！** 🎊

现在用户可以：
- 📏 点击行间距按钮
- 🎨 选择喜欢的间距
- ✨ 立即看到效果
- 😊 享受更好的阅读体验


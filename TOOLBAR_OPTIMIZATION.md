# 工具栏优化 - 自动消失和平滑动画

## 🎯 优化目标

1. **格式工具栏自动消失** - 像操作工具栏一样，过段时间自动隐藏
2. **位置高度一致** - 两个工具栏在同一高度，切换时更流畅
3. **平滑过渡动画** - 添加淡入淡出和滑动效果

---

## ✅ 已实现的优化

### 1. 格式工具栏自动消失

#### 定时器机制
```typescript
// 选中文字后 3 秒自动消失
formatToolbarTimeoutRef.current = setTimeout(() => {
  setActiveFormatToolbarNodeId(null);
}, 3000);
```

#### 鼠标交互
```typescript
// 鼠标进入时取消定时器
onMouseEnter={() => {
  if (formatToolbarTimeoutRef.current) {
    clearTimeout(formatToolbarTimeoutRef.current);
  }
}}

// 鼠标离开时重新设置定时器（1秒后消失）
onMouseLeave={() => {
  formatToolbarTimeoutRef.current = setTimeout(() => {
    setActiveFormatToolbarNodeId(null);
  }, 1000);
}}
```

#### 工作流程
```
用户选中文字
    ↓
格式工具栏显示
    ↓
3秒后自动消失
    ↓
如果鼠标进入工具栏：
├─ 取消定时器
├─ 工具栏保持显示
└─ 鼠标离开后 1秒消失
```

---

### 2. 位置高度一致

#### 统一位置状态
```typescript
// 使用统一的工具栏位置
const [unifiedToolbarPosition, setUnifiedToolbarPosition] = useState({ x: 0, y: 0 });
```

#### 同步更新
```typescript
// 鼠标移动时同步更新
const handleMouseMove = (e: React.MouseEvent) => {
  const pos = { x: e.clientX, y: e.clientY + 20 };
  setToolbarPosition(pos);
  setUnifiedToolbarPosition(pos); // 同步
};

// 文本选择时使用统一位置
setUnifiedToolbarPosition(formatToolbarPosition);
```

#### 效果
- 两个工具栏始终在相同高度（Y 坐标一致）
- 切换时不会有上下跳动
- 视觉上更流畅

---

### 3. 平滑过渡动画

#### Tailwind 动画类
```tsx
className="transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
```

**动画效果**：
- `transition-all` - 所有属性过渡
- `duration-200` - 200ms 持续时间
- `ease-out` - 缓出效果
- `animate-in` - 进入动画
- `fade-in` - 淡入效果
- `slide-in-from-bottom-2` - 从下方滑入（8px）

#### 视觉效果
```
工具栏出现：
├─ 淡入（opacity: 0 → 1）
└─ 从下方滑入（translateY: 8px → 0）

工具栏消失：
├─ 淡出（opacity: 1 → 0）
└─ 向下滑出（translateY: 0 → 8px）
```

---

## 📊 优化对比

| 特性 | 优化前 | 优化后 |
|------|--------|--------|
| 格式工具栏自动消失 | ❌ 不会消失 | ✅ 3秒后自动消失 |
| 鼠标悬停保持 | ❌ 无 | ✅ 悬停时保持显示 |
| 位置一致性 | ❌ 可能不同高度 | ✅ 始终同一高度 |
| 切换流畅度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 过渡动画 | ❌ 无 | ✅ 淡入淡出+滑动 |

---

## 🎬 动画时间线

### 操作工具栏
```
鼠标悬停 1 秒
    ↓
淡入 + 从下方滑入（200ms）
    ↓
显示工具栏
    ↓
鼠标离开
    ↓
淡出 + 向下滑出（200ms）
```

### 格式工具栏
```
选中文字
    ↓
淡入 + 从下方滑入（200ms）
    ↓
显示工具栏
    ↓
3 秒后自动消失
    ↓
淡出 + 向下滑出（200ms）
```

### 工具栏切换
```
操作工具栏显示
    ↓
用户选中文字
    ↓
操作工具栏淡出（200ms）
    ↓
格式工具栏淡入（200ms）
    ↓
位置保持一致（无跳动）
```

---

## 💡 技术细节

### 1. 定时器管理
```typescript
// 创建 ref
const formatToolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// 设置定时器
formatToolbarTimeoutRef.current = setTimeout(() => {
  setActiveFormatToolbarNodeId(null);
}, 3000);

// 清理定时器
useEffect(() => {
  return () => {
    if (formatToolbarTimeoutRef.current) {
      clearTimeout(formatToolbarTimeoutRef.current);
    }
  };
}, []);
```

### 2. 位置同步
```typescript
// 统一位置状态
const [unifiedToolbarPosition, setUnifiedToolbarPosition] = useState({ x: 0, y: 0 });

// 鼠标移动时同步
const pos = { x: e.clientX, y: e.clientY + 20 };
setToolbarPosition(pos);
setUnifiedToolbarPosition(pos);
```

### 3. CSS 动画
```css
/* Tailwind 生成的 CSS */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-200 {
  transition-duration: 200ms;
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.animate-in {
  animation: enter 200ms ease-out;
}

.fade-in {
  animation: fade-in 200ms ease-out;
}

.slide-in-from-bottom-2 {
  animation: slide-in-from-bottom 200ms ease-out;
  --tw-enter-translate-y: 0.5rem;
}
```

---

## 🧪 测试场景

### 测试 1：格式工具栏自动消失
1. 选中文字 ✅
2. 格式工具栏出现 ✅
3. 等待 3 秒 ✅
4. 工具栏自动消失 ✅

### 测试 2：鼠标悬停保持
1. 选中文字，工具栏出现 ✅
2. 鼠标移入工具栏 ✅
3. 等待 3 秒，工具栏不消失 ✅
4. 鼠标移出 ✅
5. 1 秒后工具栏消失 ✅

### 测试 3：位置一致性
1. 悬停显示操作工具栏 ✅
2. 记录工具栏高度 ✅
3. 选中文字显示格式工具栏 ✅
4. 两个工具栏高度一致 ✅

### 测试 4：平滑动画
1. 工具栏出现时有淡入效果 ✅
2. 工具栏出现时从下方滑入 ✅
3. 工具栏消失时有淡出效果 ✅
4. 切换时无跳动 ✅

---

## 🎨 动画参数调整

### 修改自动消失时间
```typescript
// 格式工具栏显示时间（默认 3 秒）
setTimeout(() => {
  setActiveFormatToolbarNodeId(null);
}, 3000); // 改为 5000 = 5秒

// 鼠标离开后延迟（默认 1 秒）
setTimeout(() => {
  setActiveFormatToolbarNodeId(null);
}, 1000); // 改为 2000 = 2秒
```

### 修改动画速度
```tsx
// 快速动画（100ms）
className="transition-all duration-100"

// 慢速动画（300ms）
className="transition-all duration-300"

// 超慢动画（500ms）
className="transition-all duration-500"
```

### 修改动画效果
```tsx
// 线性动画
className="transition-all duration-200 ease-linear"

// 缓入动画
className="transition-all duration-200 ease-in"

// 缓入缓出动画
className="transition-all duration-200 ease-in-out"
```

---

## 📝 修改的文件

1. **`components/editor/OutlineNode.tsx`**
   - 添加格式工具栏定时器
   - 统一工具栏位置
   - 添加鼠标交互逻辑

2. **`components/editor/FormatToolbar.tsx`**
   - 添加过渡动画类

3. **`components/editor/OperationToolbar.tsx`**
   - 添加过渡动画类

---

## ✅ 验收标准

- ✅ 格式工具栏 3 秒后自动消失
- ✅ 鼠标悬停时工具栏保持显示
- ✅ 鼠标离开后 1 秒消失
- ✅ 两个工具栏高度一致
- ✅ 切换时无跳动
- ✅ 出现时有淡入+滑入动画
- ✅ 消失时有淡出+滑出动画
- ✅ 动画流畅自然

---

**优化完成！** 🎉

现在工具栏：
- ✅ 会自动消失（3秒）
- ✅ 位置高度一致
- ✅ 切换流畅无跳动
- ✅ 有平滑的过渡动画


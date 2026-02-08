# 🚫 工具栏互斥规则 - 格式工具栏优先

## 📋 新规则

**当格式工具栏（文字控制）触发后，禁用操作工具栏（层级控制）3秒钟。**

---

## 🎯 目的

1. **避免冲突** - 防止两个工具栏同时出现或快速切换
2. **用户体验** - 用户选中文字后，专注于格式化操作
3. **优先级** - 格式工具栏优先级高于操作工具栏

---

## 🔧 实现方式

### 1. 添加禁用状态

```typescript
const [isOperationDisabled, setIsOperationDisabled] = useState(false);
const disableOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### 2. 显示格式工具栏时禁用操作工具栏

```typescript
const showFormatToolbar = (x: number, y: number) => {
  clearAllTimeouts();
  setPosition({ x, y: y + 5 });
  setToolbarType('format');
  setActiveToolbarNodeId(nodeId);
  
  // ✅ 禁用操作工具栏 3 秒
  setIsOperationDisabled(true);
  if (disableOperationTimeoutRef.current) {
    clearTimeout(disableOperationTimeoutRef.current);
  }
  disableOperationTimeoutRef.current = setTimeout(() => {
    setIsOperationDisabled(false);
  }, 3000);
  
  // 2秒后自动关闭格式工具栏
  timeoutRef.current = setTimeout(() => {
    hideToolbar();
  }, 2000);
};
```

### 3. 操作工具栏检查禁用状态

```typescript
const showOperationToolbar = (x: number, y: number) => {
  // ✅ 如果操作工具栏被禁用，不显示
  if (isOperationDisabled) return;
  
  clearAllTimeouts();
  setPosition({ x, y: y + 5 });
  setToolbarType('operation');
  setActiveToolbarNodeId(nodeId);
};
```

---

## 🎬 工作流程

### 场景 1：正常使用操作工具栏

```
鼠标悬停节点 1 秒
    ↓
isOperationDisabled = false ✅
    ↓
显示操作工具栏
    ↓
正常使用
```

### 场景 2：选中文字后禁用操作工具栏

```
用户选中文字
    ↓
显示格式工具栏
    ↓
isOperationDisabled = true ✅
    ↓
启动 3 秒定时器
    ↓
用户鼠标移动（尝试触发操作工具栏）
    ↓
showOperationToolbar() 检查 isOperationDisabled
    ↓
isOperationDisabled = true ❌
    ↓
直接返回，不显示操作工具栏 ✅
    ↓
3 秒后
    ↓
isOperationDisabled = false ✅
    ↓
操作工具栏恢复可用
```

### 场景 3：格式工具栏消失后

```
格式工具栏显示
    ↓
2 秒后自动关闭
    ↓
格式工具栏消失
    ↓
但 isOperationDisabled 仍然是 true ✅
    ↓
再过 1 秒（总共 3 秒）
    ↓
isOperationDisabled = false ✅
    ↓
操作工具栏恢复可用
```

---

## ⏱️ 时间线

```
t=0s: 用户选中文字
    ↓
    格式工具栏显示
    操作工具栏禁用 ✅
    ↓
t=2s: 格式工具栏自动关闭
    ↓
    操作工具栏仍然禁用 ✅
    ↓
t=3s: 操作工具栏解除禁用
    ↓
    操作工具栏恢复可用 ✅
```

---

## 📊 状态对比

| 时间 | 格式工具栏 | 操作工具栏 | isOperationDisabled |
|------|-----------|-----------|---------------------|
| 选中文字前 | ❌ 隐藏 | ✅ 可用 | false |
| 选中文字时 | ✅ 显示 | ❌ 禁用 | true |
| 2秒后 | ❌ 关闭 | ❌ 禁用 | true |
| 3秒后 | ❌ 隐藏 | ✅ 可用 | false |

---

## 🎯 优势

### 1. 避免冲突
```
修复前：
用户选中文字 → 格式工具栏显示
鼠标轻微移动 → 操作工具栏也显示 ❌
两个工具栏快速切换 ❌

修复后：
用户选中文字 → 格式工具栏显示
鼠标轻微移动 → 操作工具栏被禁用 ✅
只显示格式工具栏 ✅
```

### 2. 用户体验
```
修复前：
选中文字 → 想点击"粗体"
鼠标移动 → 工具栏切换成操作工具栏 ❌
找不到"粗体"按钮 ❌

修复后：
选中文字 → 想点击"粗体"
鼠标移动 → 格式工具栏保持显示 ✅
顺利点击"粗体" ✅
```

### 3. 优先级明确
```
格式工具栏（文字控制）> 操作工具栏（层级控制）

用户选中文字 = 明确的格式化意图
→ 格式工具栏优先
→ 操作工具栏暂时禁用
```

---

## 🔧 技术细节

### 定时器管理

```typescript
// 格式工具栏定时器（2秒后关闭）
timeoutRef.current = setTimeout(() => {
  hideToolbar();
}, 2000);

// 操作工具栏禁用定时器（3秒后解除）
disableOperationTimeoutRef.current = setTimeout(() => {
  setIsOperationDisabled(false);
}, 3000);
```

### 清理机制

```typescript
useEffect(() => {
  return () => {
    clearAllTimeouts();
    if (disableOperationTimeoutRef.current) {
      clearTimeout(disableOperationTimeoutRef.current);
    }
  };
}, []);
```

### 状态导出

```typescript
return {
  toolbarType,
  position,
  showOperationToolbar,
  showFormatToolbar,
  hideToolbar,
  delayedHide,
  cancelHide,
  updatePosition,
  isOperationDisabled, // ✅ 导出禁用状态（可选）
};
```

---

## 🧪 测试场景

### 测试 1：选中文字后悬停
1. 选中文字 ✅
2. 格式工具栏显示 ✅
3. 鼠标移动到节点其他位置 ✅
4. 操作工具栏不显示 ✅
5. 等待 3 秒 ✅
6. 鼠标移动 ✅
7. 操作工具栏显示 ✅

### 测试 2：快速切换
1. 选中文字 ✅
2. 格式工具栏显示 ✅
3. 立即鼠标移开 ✅
4. 操作工具栏不显示 ✅
5. 格式工具栏 2 秒后关闭 ✅
6. 再等 1 秒 ✅
7. 操作工具栏恢复可用 ✅

### 测试 3：多次选中
1. 选中文字 A ✅
2. 格式工具栏显示 ✅
3. 1 秒后选中文字 B ✅
4. 格式工具栏切换到 B ✅
5. 禁用定时器重置为 3 秒 ✅
6. 操作工具栏保持禁用 ✅

---

## 📝 修改的文件

1. ✅ `hooks/useUnifiedToolbar.ts`
   - 添加 `isOperationDisabled` 状态
   - 添加 `disableOperationTimeoutRef` 定时器
   - 在 `showFormatToolbar` 中禁用操作工具栏
   - 在 `showOperationToolbar` 中检查禁用状态

---

## ✅ 验收标准

- ✅ 选中文字后，操作工具栏不会显示
- ✅ 格式工具栏显示期间，操作工具栏被禁用
- ✅ 格式工具栏关闭后，操作工具栏仍禁用 1 秒
- ✅ 3 秒后，操作工具栏恢复可用
- ✅ 不会出现两个工具栏快速切换的情况

---

## 🎉 总结

### 新规则
**格式工具栏触发后，禁用操作工具栏 3 秒**

### 效果
- ✅ 避免工具栏冲突
- ✅ 提升用户体验
- ✅ 优先级明确
- ✅ 交互更流畅

### 时间设置
- 格式工具栏：2 秒后自动关闭
- 操作工具栏：3 秒后解除禁用
- 差值：1 秒缓冲期

---

**规则已添加！** 🎊

现在格式工具栏和操作工具栏不会再冲突了！


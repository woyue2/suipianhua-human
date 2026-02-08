# UI 问题排查指南

## 问题描述
右侧编辑区域显示"暂无内容"，但数据应该已经初始化。

## 可能的原因

### 1. 数据初始化问题
检查浏览器控制台（F12）是否有以下日志：
```
🚀 Initializing app...
✅ Initialized with data: 读书笔记《我们如何学习》
```

如果没有这些日志，说明初始化没有执行。

### 2. Store 状态问题
在浏览器控制台执行以下命令检查状态：
```javascript
// 检查 store 状态
const store = window.__ZUSTAND_STORE__ || {}
console.log('rootId:', store.rootId)
console.log('nodes:', Object.keys(store.nodes || {}).length)
```

### 3. 组件渲染问题
检查是否有 React 错误：
- 打开浏览器控制台（F12）
- 查看 Console 标签页
- 查找红色错误信息

## 快速修复步骤

### 步骤 1：清除浏览器缓存
1. 按 `Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（Mac）强制刷新
2. 或者清除浏览器缓存后重新加载

### 步骤 2：检查控制台日志
打开浏览器开发者工具（F12），查看：
1. **Console** 标签 - 查看是否有错误
2. **Network** 标签 - 查看是否有请求失败
3. **Application** 标签 → IndexedDB - 查看数据是否存在

### 步骤 3：手动初始化数据
如果数据没有初始化，在浏览器控制台执行：

```javascript
// 获取 store
import { useEditorStore } from '@/lib/store'
import { INITIAL_NODES } from '@/lib/constants'

// 手动初始化
const store = useEditorStore.getState()
store.initializeWithData(INITIAL_NODES, 'root', '读书笔记《我们如何学习》')

// 刷新页面
location.reload()
```

### 步骤 4：检查 OutlineNode.tsx 语法错误
运行构建检查是否有语法错误：
```bash
cd /home/aa/Park/tree-index
npm run build
```

如果有错误，查看错误信息并修复。

## 常见错误及解决方案

### 错误 1：Cannot read properties of undefined
**原因**：Store 中的数据结构不正确

**解决**：
```javascript
// 检查 nodes 结构
console.log(useEditorStore.getState().nodes)

// 应该看到类似这样的结构：
// {
//   'root': { id: 'root', children: ['1', '2', '3'], ... },
//   '1': { id: '1', parentId: 'root', ... },
//   ...
// }
```

### 错误 2：useEffect 依赖警告
**原因**：useEffect 的依赖数组可能导致无限循环

**解决**：检查 `app/page.tsx` 中的 useEffect

### 错误 3：图片组件导入错误
**原因**：ImageUploader 或 NodeImages 组件有问题

**解决**：
```bash
# 检查组件是否存在
ls -la components/editor/ImageUploader.tsx
ls -la components/editor/NodeImages.tsx

# 检查导入是否正确
grep -n "ImageUploader\|NodeImages" components/editor/OutlineNode.tsx
```

## 调试命令

### 检查服务器状态
```bash
cd /home/aa/Park/tree-index
lsof -i :3000
```

### 查看实时日志
```bash
# 查看 Next.js 开发服务器日志
cd /home/aa/Park/tree-index
npm run dev
```

### 重启开发服务器
```bash
# 停止所有 Next.js 进程
pkill -f "next dev"

# 重新启动
cd /home/aa/Park/tree-index
npm run dev
```

## 验证修复

修复后，应该看到：
1. ✅ 左侧边栏显示文档列表
2. ✅ 右侧显示大纲内容（不是"暂无内容"）
3. ✅ 悬停节点1秒后显示工具栏
4. ✅ 工具栏包含图片上传按钮（🖼️）

## 如果问题仍然存在

请提供以下信息：
1. 浏览器控制台的完整错误信息（截图）
2. Network 标签中的请求状态
3. `npm run build` 的输出

---

**提示**：最常见的问题是浏览器缓存导致的。先尝试强制刷新（Ctrl + Shift + R）！


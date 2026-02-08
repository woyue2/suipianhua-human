# 🧪 前后端交互测试指南

## ✅ 已修复的问题

1. **移除动态导入** - 将 `documentDb` 改为静态导入
2. **添加调试日志** - 所有按钮点击都有控制台输出
3. **修复事件处理** - 确保所有按钮都有正确的 onClick 处理

## 🔍 如何测试

### 1. 访问应用
打开浏览器访问：**http://localhost:5200**

### 2. 打开浏览器控制台
按 `F12` 打开开发者工具，切换到 Console 标签

### 3. 测试功能

#### ✅ 初始化测试
页面加载后，控制台应该显示：
```
🚀 Initializing app...
✅ Initialized with data: 读书笔记《我们如何学习》
✅ Fetched documents: 0
```

#### ✅ 深色模式切换
点击右下角的月亮/太阳按钮，控制台应该显示：
```
🌓 Dark mode toggle clicked
🌙 Dark mode enabled
```
或
```
☀️ Light mode enabled
```

#### ✅ 保存功能
点击工具栏的保存按钮，控制台应该显示：
```
💾 Save button clicked
✅ Document saved successfully: [document-id]
✅ Save completed
```

#### ✅ 导出功能
点击导出按钮，控制台应该显示：
```
📤 Export button clicked
✅ Export completed
```
并且会下载一个 JSON 文件

#### ✅ 导入功能
点击导入按钮，选择 JSON 文件，控制台应该显示：
```
📥 Import button clicked
📄 Reading file: [filename]
✅ Document loaded: [document-id]
✅ Import completed
```

#### ✅ 撤销/重做
点击撤销按钮，控制台应该显示：
```
↶ Undo button clicked
↶ Undo performed
✅ Document loaded: [document-id]
```

点击重做按钮，控制台应该显示：
```
↷ Redo button clicked
↷ Redo performed
✅ Document loaded: [document-id]
```

#### ✅ AI 重组
点击 ✨ 按钮，控制台应该显示：
```
✨ AI button clicked
```
并且会打开 AI 重组弹窗

#### ✅ 设置
点击设置按钮，控制台应该显示：
```
⚙️ Settings button clicked
```
并且会打开设置弹窗

#### ✅ 快捷键
- 按 `Ctrl+Z`，控制台应该显示：
  ```
  ⌨️ Keyboard shortcut: Undo
  ```
- 按 `Ctrl+Y`，控制台应该显示：
  ```
  ⌨️ Keyboard shortcut: Redo
  ```

## 🐛 如果按钮不工作

### 检查清单

1. **检查控制台是否有错误**
   - 打开 F12 开发者工具
   - 查看 Console 标签是否有红色错误信息

2. **检查是否有 JavaScript 加载错误**
   - 在 Network 标签中查看是否有失败的请求
   - 特别注意 `.js` 文件是否正常加载

3. **强制刷新浏览器**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

4. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Delete`
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

5. **检查服务器是否正常运行**
   ```bash
   ps aux | grep "next dev"
   ```
   应该看到 Next.js 进程在运行

6. **重启开发服务器**
   ```bash
   cd /home/aa/Park/tree-index
   pkill -9 -f "next dev"
   PORT=5200 npm run dev
   ```

## 📊 预期的控制台输出示例

正常工作时，控制台应该类似这样：

```
🚀 Initializing app...
✅ Initialized with data: 读书笔记《我们如何学习》
✅ Fetched documents: 0
☀️ Light mode enabled
💾 Save button clicked
✅ Document saved successfully: abc-123-def
✅ Save completed
🌓 Dark mode toggle clicked
🌙 Dark mode enabled
📤 Export button clicked
✅ Export completed
✨ AI button clicked
⚙️ Settings button clicked
```

## 🔧 后端交互说明

### IndexedDB 持久化
- **保存**: `documentDb.saveDocument(document)`
- **加载**: `documentDb.loadDocument(documentId)`
- **列表**: `documentDb.listDocuments()`
- **删除**: `documentDb.deleteDocument(documentId)`

### AI 重组
- **Server Action**: `reorganizeOutline(currentTree)`
- **返回**: `{ reasoning: string, newStructure: OutlineNode }`

### 图床上传（已就绪）
- **API**: `POST /api/upload`
- **Headers**: `x-image-provider`, `x-image-api-key`
- **返回**: `{ success: true, url: string }`

## ✅ 成功标志

如果看到以下现象，说明前后端交互正常：

1. ✅ 点击按钮后控制台有对应的日志输出
2. ✅ 保存按钮显示 ✓ 图标
3. ✅ 深色模式切换生效
4. ✅ 导出能下载 JSON 文件
5. ✅ 导入能加载 JSON 文件
6. ✅ AI 和设置弹窗能正常打开
7. ✅ 撤销/重做按钮状态正确（有历史时可用）

---

**测试完成后，请告诉我哪些功能正常，哪些还有问题！**


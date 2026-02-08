# 测试文档索引

## 测试文档

| 文档 | 描述 |
|------|------|
| [FRONTEND-BACKEND-TEST.md](./FRONTEND-BACKEND-TEST.md) | 前后端交互测试指南 - 包含所有功能的手动测试步骤 |
| [ZHIPU-AI-TEST.md](./ZHIPU-AI-TEST.md) | 智谱 AI 功能测试指南 - AI 重组功能测试 |
| [E2E-TEST-REPORT.md](./E2E-TEST-REPORT.md) | Playwright E2E 自动化测试报告 |

## 测试脚本

| 脚本 | 描述 |
|------|------|
| [e2e-test.js](./e2e-test.js) | Playwright E2E 自动化测试脚本 |

## 快速开始

### 手动测试
```bash
# 1. 启动开发服务器
npm run dev

# 2. 浏览器打开 http://localhost:3003

# 3. 按照 FRONTEND-BACKEND-TEST.md 中的步骤测试
```

### E2E 自动化测试
```bash
# 1. 启动开发服务器
PORT=3004 npm run dev

# 2. 运行 E2E 测试
node tests/e2e-test.js
```

### AI 功能测试
```bash
# 按照 ZHIPU-AI-TEST.md 中的步骤测试 AI 重组功能
```

## 测试覆盖范围

- ✅ 页面加载与渲染
- ✅ 工具栏按钮交互
- ✅ 节点编辑功能
- ✅ 保存/加载（IndexedDB）
- ✅ 导入/导出
- ✅ 撤销/重做
- ✅ 深色模式切换
- ✅ AI 重组功能
- ✅ 后端 API 端点

# 智谱 AI 配置指南

本文档介绍如何配置智谱AI (ZhipuAI) 的 API Key 用于 AI 重组功能。

---

## 📝 获取智谱AI API Key

### 步骤 1: 注册账号

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 点击右上角"注册"创建账号
3. 完成手机号验证和实名认证

### 步骤 2: 获取 API Key

1. 登录后，进入 [控制台](https://open.bigmodel.cn/console/center)
2. 点击左侧菜单"API Key"
3. 点击"创建API Key"
4. 复制生成的 API Key（格式如：`xxxxxxxx.xxxxxxxx`）

---

## ⚙️ 配置项目

### 方法 1: 使用 `.env.local` 文件

1. 在项目根目录找到 `.env.local` 文件
2. 添加智谱AI的API Key：

```bash
# 智谱 AI API Key
ZHIPU_API_KEY=你的API_KEY
```

### 方法 2: 使用环境变量（生产环境）

在部署平台（如 Vercel）的环境变量设置中添加：

```bash
ZHIPU_API_KEY=你的API_KEY
```

---

## 🎯 可用模型

配置完成后，你可以在 AI 重组功能中选择以下智谱AI模型：

| 模型 ID | 名称 | 说明 | 推荐场景 |
|---------|------|------|----------|
| `glm-4-flash` | GLM-4 Flash | 免费快速 | 日常使用，快速重组 |
| `glm-4-plus` | GLM-4 Plus | 高性能 | 复杂大纲，深度分析 |
| `glm-4-air` | GLM-4 Air | 轻量级 | 简单大纲，经济实惠 |

---

## ✅ 验证配置

### 测试 API Key 是否有效

1. 启动项目：
```bash
npm run dev
```

2. 打开浏览器访问 `http://localhost:3000`
3. 点击顶部的"AI 智能重组"按钮
4. 选择"智谱AI"提供商
5. 选择模型（如：GLM-4 Flash）
6. 点击"开始重组"

如果配置正确，AI 将开始分析大纲结构。

---

## 🔧 常见问题

### Q: API Key 格式是什么样的？
A: 智谱AI的API Key格式为：`xxxxxxxx.xxxxxxxx`（两段字符串用点号分隔）

### Q: 免费额度有多少？
A: GLM-4 Flash 模型提供免费额度，具体请查看[智谱AI价格页面](https://open.bigmodel.cn/console/price)

### Q: 调用失败怎么办？
A: 检查以下几点：
1. API Key 是否正确复制
2. 是否完成了实名认证
3. 账户是否有可用额度
4. 网络连接是否正常

### Q: 可以同时使用 OpenAI 和智谱AI 吗？
A: 可以！在 `.env.local` 中同时配置：
```bash
OPENAI_API_KEY=你的OpenAI_Key
ZHIPU_API_KEY=你的智谱AI_Key
```
然后在UI中自由切换。

---

## 📚 相关文档

- [智谱AI官方文档](https://open.bigmodel.cn/dev/index)
- [GLM-4 API 文档](https://open.bigmodel.cn/dev/api)
- [项目规范文档](./docs/spec/spec-draft.md)

---

## 🆘 获取帮助

如果遇到问题，请：
1. 查看浏览器控制台错误信息
2. 检查终端服务器日志
3. 访问 [智谱AI开发者社区](https://open.bigmodel.cn/console/forum)

---

**配置完成后，重启开发服务器使环境变量生效：**
```bash
npm run dev
```

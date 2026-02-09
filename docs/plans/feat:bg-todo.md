# 随机背景功能设计文档

## 📋 需求概述

**功能定位：** 个性化装饰 + 视觉刺激
- 让用户可以自定义背景，增加视觉美感
- 通过随机变化的背景帮助激发创造力和灵感

**核心需求：**
- 在文章内容/编辑器区域显示随机女性照片作为背景
- 使用免费图库 API（Unsplash）获取图片
- 用户手动点击按钮切换背景
- 背景不影响内容阅读

---

## 🏗️ 架构设计

### 整体架构

功能将在现有的大纲编辑器中实现，主要涉及三个层级：

#### 1. API 层
**文件：** `lib/image-bg.ts`

封装 Unsplash API 调用：
- Unsplash 提供免费的 REST API
- 支持按关键词搜索（"woman", "portrait", "female"）
- 每次返回随机图片
- 需要注册获取 access key
- 有速率限制（每小时 50 次请求）

```typescript
// 接口示例
interface ImageBgService {
  fetchRandomPortrait(): Promise<string> // 返回图片 URL
  preloadImage(url: string): Promise<void> // 预加载图片
}
```

#### 2. 状态层
**文件：** `lib/store.ts`

添加背景图片相关状态：

```typescript
interface BackgroundState {
  backgroundImage: string | null  // 当前背景 URL
  backgroundLoading: boolean      // 加载状态
  backgroundError: string | null  // 错误信息
}

interface BackgroundActions {
  setBackgroundImage: (url: string) => void
  fetchRandomBackground: () => Promise<void>
  clearBackground: () => void
}
```

#### 3. UI 层
**组件：**
- `OutlineTree` - 添加背景展示
- `SettingsModal` - 添加"换背景"按钮

背景使用 CSS 的 `background-image` 实现，配合半透明遮罩层保证文字可读性。

---

## 📐 详细设计

### API 选择和集成

**Unsplash API 优势：**
- ✅ 完全免费
- ✅ 高质量照片
- ✅ 明确的授权许可
- ✅ REST API 简单易用
- ✅ 支持响应式图片

**API 端点：**
```
GET https://api.unsplash.com/photos/random
Query params:
  - query: "woman" | "portrait" | "female"
  - orientation: "landscape"
  - count: 1
Headers:
  - Authorization: Client-ID YOUR_ACCESS_KEY
```

**实现要点：**
- 使用 `fetch` 进行 API 调用
- 缓存最近 5 张图片，避免重复请求
- 实现重试机制（最多 3 次）
- 处理速率限制（429 错误）

### UI 组件设计

#### 设置面板按钮
在 `SettingsModal` 中添加：

```tsx
<button
  onClick={handleChangeBackground}
  disabled={backgroundLoading}
  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
>
  {backgroundLoading ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      <span>加载中...</span>
    </>
  ) : (
    <>
      <Image size={16} />
      <span>换背景</span>
    </>
  )}
</button>
```

#### 背景展示层
在 `OutlineTree` 组件中添加：

```tsx
<div
  className="relative min-h-full"
  style={{
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}
>
  {/* 半透明遮罩层，保证可读性 */}
  {backgroundImage && (
    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90" />
  )}

  {/* 原有内容 */}
  <div className="relative z-10">
    {/* 大纲内容 */}
  </div>
</div>
```

### 状态管理

**状态初始化：**
```typescript
backgroundImage: null,
backgroundLoading: false,
backgroundError: null
```

**Actions 实现：**

1. **fetchRandomBackground**
   - 调用 API 获取图片
   - 预加载图片（避免闪烁）
   - 更新状态
   - 处理错误

2. **setBackgroundImage**
   - 直接设置背景 URL
   - 保存到 localStorage

3. **clearBackground**
   - 清除背景
   - 更新 localStorage

### 图片处理和优化

**预加载策略：**
```typescript
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}
```

**性能优化：**
- 使用 `loading="lazy"` 属性
- 缓存已加载的图片 URL
- 限制图片大小（Unsplash 参数：`w=1920`）
- 使用 WebP 格式（如果浏览器支持）

**可读性处理：**
- 半透明白色遮罩层（亮色模式：`bg-white/90`）
- 半透明深色遮罩层（暗色模式：`bg-slate-900/90`）
- 可配置遮罩透明度（80-95%）

### 错误处理

**可能的错误场景：**
1. API 请求失败（网络错误）
2. 速率限制（429）
3. 图片加载失败
4. 无效的 URL

**处理策略：**
- 显示 toast 通知用户
- 保留当前背景，不破坏体验
- 记录错误日志
- 自动重试（最多 3 次，指数退避）

### 本地存储

**localStorage 结构：**
```json
{
  "backgroundImage": "https://images.unsplash.com/...",
  "backgroundUpdatedAt": 1707456000000
}
```

**持久化逻辑：**
- 设置背景时保存到 localStorage
- 应用启动时从 localStorage 恢复
- 提供"清除背景"功能清除存储

---

## 🔧 实现清单

### Phase 1: 基础功能
- [ ] 创建 `lib/image-bg.ts` - Unsplash API 封装
- [ ] 在 `lib/store.ts` 添加背景相关状态
- [ ] 在 `OutlineTree` 添加背景展示层
- [ ] 在 `SettingsModal` 添加"换背景"按钮
- [ ] 实现 localStorage 持久化

### Phase 2: 优化和增强
- [ ] 添加图片预加载
- [ ] 实现图片缓存机制
- [ ] 添加遮罩透明度配置
- [ ] 错误处理和重试机制
- [ ] 加载状态指示器

### Phase 3: 测试和文档
- [ ] 单元测试（API 层）
- [ ] 集成测试（状态管理）
- [ ] UI 测试（组件渲染）
- [ ] 性能测试（加载时间）
- [ ] 更新用户文档

---

## 📝 待确认事项

1. **Unsplash API Key** - 需要注册并获取 Access Key
2. **遮罩透明度** - 默认 90% 是否合适？
3. **是否需要"清除背景"按钮** - 还是只通过设置清除？
4. **图片缓存策略** - 缓存多少张合适？
5. **是否需要分类选择** - 除了"女性"，是否需要其他分类？

---

## 🚀 实施步骤

1. **注册 Unsplash 开发者账号**
   - 访问 https://unsplash.com/developers
   - 创建应用获取 Access Key
   - 配置应用权限

2. **创建开发分支**
   ```bash
   git checkout -b feat/random-background
   ```

3. **按 Phase 顺序实施**
   - 从基础功能开始
   - 逐步添加优化
   - 最后完善测试

4. **测试和发布**
   - 本地测试
   - 提交 PR
   - 代码审查
   - 合并到主分支

---

**创建时间：** 2026-02-09
**状态：** 待实施

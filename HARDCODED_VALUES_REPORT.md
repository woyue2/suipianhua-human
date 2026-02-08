# 硬编码内容分析报告

生成日期：2026-02-08
扫描范围：app/, components/, lib/, hooks/, utils/

---

## 一、硬编码内容清单

### 1. 魔法数字（Magic Numbers）

| 文件 | 行号 | 硬编码值 | 类型 | 建议常量名 |
|------|------|----------|------|-----------|
| `ImageUploader.tsx` | 79 | `3000` | 超时时间 | `TIMEOUTS.ERROR_DISPLAY` |
| `LineSpacingControl.tsx` | 42 | `w-48` | 菜单宽度 | `UI_SIZES.MENU.WIDTH` |
| `Sidebar.tsx` | 283 | `w-8 h-8` | 按钮尺寸 | `UI_SIZES.BUTTON.SMALL` |
| `Sidebar.tsx` | 268 | `w-10 h-10` | 按钮尺寸 | `UI_SIZES.BUTTON.MEDIUM` |
| `OutlineNode.tsx` | 157-163 | `mb-4/8/12/16` | 行间距 | `LINE_SPACING_CLASSES` |
| `OutlineNode.tsx` | 157-163 | `mt-1/2/3/4` | 行间距 | `LINE_SPACING_CLASSES` |

### 2. API 端点

| 文件 | 行号 | 硬编码值 | 建议常量名 |
|------|------|----------|-----------|
| `ImageUploader.tsx` | 46 | `'/api/upload'` | `API_ENDPOINTS.UPLOAD` |
| `ai-config.ts` | 37 | `'https://open.bigmodel.cn/api/paas/v4/'` | `ZHIPU_API_BASE_URL` |
| `image-upload.ts` | 21, 33 | 上传 URL | `IMAGE_PROVIDERS_CONFIG` |

### 3. localStorage/sessionStorage 键名

| 文件 | 行号 | 硬编码值 | 建议常量名 |
|------|------|----------|-----------|
| `ImageUploader.tsx` | 27 | `'user-config'` | `LOCAL_STORAGE_KEYS.USER_CONFIG` |

### 4. 错误消息和提示文本

| 文件 | 行号 | 硬编码值 | 建议常量名 |
|------|------|----------|-----------|
| `ImageUploader.tsx` | 31 | `'请先在设置中配置图床 API Key'` | `ERROR_MESSAGES.IMAGE_UPLOAD_CONFIG_MISSING` |
| `ImageUploader.tsx` | 55, 78 | `'上传失败'` | `ERROR_MESSAGES.UPLOAD_FAILED` |
| `toast.ts` | 62, 69, 76, 83, 90, 97, 104, 111 | 多条 toast 消息 | `TOAST_MESSAGES.*` |

### 5. 默认值

| 文件 | 行号 | 硬编码值 | 建议常量名 |
|------|------|----------|-----------|
| `ImageUploader.tsx` | 38 | `'imgur'` | `DEFAULTS.IMAGE_PROVIDER` |
| `ai-config.ts` | 81, 84 | `'glm-4-flash'`, `'gpt-4o-mini'` | `DEFAULTS.AI_MODEL` |

### 6. 业务配置

| 文件 | 行号 | 硬编码值 | 建议常量名 |
|------|------|----------|-----------|
| `LineSpacingControl.tsx` | 12-15 | 行间距选项 | `LINE_SPACING_OPTIONS` |
| `store.ts` | 19, 62, 92 | 行间距类型 | `LineSpacingType` |

---

## 二、改进方案

### 2.1 创建统一常量文件

**建议创建：** `lib/constants/index.ts`

```typescript
/**
 * 超时时间配置
 */
export const TIMEOUTS = {
  /** 错误消息显示时长 */
  ERROR_DISPLAY: 3000,
  /** Toast 自动关闭时长 */
  TOAST_AUTO_CLOSE: 3000,
} as const;

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  /** 图片上传端点 */
  UPLOAD: '/api/upload',
} as const;

/**
 * localStorage 键名配置
 */
export const LOCAL_STORAGE_KEYS = {
  /** 用户配置 */
  USER_CONFIG: 'user-config',
  /** 编辑器状态 */
  EDITOR_STATE: 'editor-state',
} as const;

/**
 * 错误消息配置
 */
export const ERROR_MESSAGES = {
  /** 图片上传：缺少配置 */
  IMAGE_UPLOAD_CONFIG_MISSING: '请先在设置中配置图床 API Key',
  /** 图片上传：上传失败 */
  UPLOAD_FAILED: '上传失败',
  /** AI：生成失败 */
  AI_GENERATION_FAILED: 'AI 生成失败，请重试',
} as const;

/**
 * Toast 消息配置
 */
export const TOAST_MESSAGES = {
  /** 保存成功 */
  SAVE_SUCCESS: '保存成功',
  /** 导入成功 */
  IMPORT_SUCCESS: '导入成功',
  /** 导出成功 */
  EXPORT_SUCCESS: '导出成功',
  /** 复制成功 */
  COPY_SUCCESS: '已复制到剪贴板',
  /** 撤销成功 */
  UNDO_SUCCESS: '已撤销',
  /** 重做成功 */
  REDO_SUCCESS: '已重做',
  /** 删除成功 */
  DELETE_SUCCESS: '已删除',
  /** 恢复成功 */
  RESTORE_SUCCESS: '已恢复',
} as const;

/**
 * 默认值配置
 */
export const DEFAULTS = {
  /** 默认图片提供商 */
  IMAGE_PROVIDER: 'imgur',
  /** 默认行间距 */
  LINE_SPACING: 'normal',
  /** 默认 AI 模型 */
  AI_MODEL_ZHIPU: 'glm-4-flash',
  AI_MODEL_OPENAI: 'gpt-4o-mini',
} as const;

/**
 * 行间距配置
 */
export const LINE_SPACING_OPTIONS = [
  { value: 'compact', label: '紧凑', icon: '≡', description: '1.2x', classes: { mb: 'mb-4', mt: 'mt-1' } },
  { value: 'normal', label: '正常', icon: '☰', description: '1.6x', classes: { mb: 'mb-8', mt: 'mt-2' } },
  { value: 'relaxed', label: '舒适', icon: '≣', description: '2.0x', classes: { mb: 'mb-12', mt: 'mt-3' } },
  { value: 'loose', label: '宽松', icon: '≣', description: '2.5x', classes: { mb: 'mb-16', mt: 'mt-4' } },
] as const;

/** 行间距类型 */
export type LineSpacingType = typeof LINE_SPACING_OPTIONS[number]['value'];

/**
 * UI 尺寸配置
 */
export const UI_SIZES = {
  /** 按钮尺寸 */
  BUTTON: {
    SMALL: 'w-8 h-8',
    MEDIUM: 'w-10 h-10',
    LARGE: 'w-12 h-12',
  },
  /** 菜单尺寸 */
  MENU: {
    WIDTH: 'w-48',
  },
} as const;
```

### 2.2 创建图片提供商配置

**建议创建：** `config/image-providers.ts`

```typescript
/**
 * 图片上传提供商配置
 */
export const IMAGE_PROVIDERS_CONFIG = {
  imgur: {
    name: 'Imgur',
    uploadUrl: 'https://api.imgur.com/3/image',
    formFieldName: 'image',
    headers: (apiKey: string) => ({
      'Authorization': `Client-ID ${apiKey}`,
    }),
  },
  smms: {
    name: 'SM.MS',
    uploadUrl: 'https://sm.ms/api/v2/upload',
    formFieldName: 'smfile',
    headers: () => ({}),
  },
  // 可扩展其他提供商
} as const;

export type ImageProvider = keyof typeof IMAGE_PROVIDERS_CONFIG;
```

### 2.3 创建 AI 配置文件

**优化现有：** `lib/ai-config.ts`

```typescript
import { DEFAULTS } from './constants';

/** AI 提供商配置 */
export const AI_PROVIDERS = {
  ZHIPU: {
    name: '智谱 AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    defaultModel: DEFAULTS.AI_MODEL_ZHIPU,
    models: [
      { id: 'glm-4-flash', name: 'GLM-4-Flash', description: '超快速文本生成' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', description: '高质量文本生成' },
      { id: 'glm-4-air', name: 'GLM-4-Air', description: '经济实用型' },
    ],
  },
  OPENAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/',
    defaultModel: DEFAULTS.AI_MODEL_OPENAI,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini', description: '快速且高效' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '最强大的模型' },
    ],
  },
} as const;
```

---

## 三、重构优先级

### 🔴 高优先级（立即处理）

1. **错误消息和 Toast 消息**
   - 影响：国际化、用户体验
   - 文件：`ImageUploader.tsx`, `toast.ts`
   - 工作量：1-2 小时

2. **API 端点**
   - 影响：API 版本管理、环境切换
   - 文件：`ImageUploader.tsx`, `ai-config.ts`, `image-upload.ts`
   - 工作量：1 小时

### 🟡 中优先级（本周处理）

3. **localStorage 键名**
   - 影响：数据管理、冲突避免
   - 文件：`ImageUploader.tsx`
   - 工作量：30 分钟

4. **超时时间**
   - 影响：用户体验一致性
   - 文件：`ImageUploader.tsx`
   - 工作量：30 分钟

5. **行间距配置**
   - 影响：功能维护性
   - 文件：`LineSpacingControl.tsx`, `store.ts`, `OutlineNode.tsx`
   - 工作量：1 小时

### 🟢 低优先级（有空处理）

6. **UI 尺寸配置**
   - 影响：设计系统一致性
   - 文件：`Sidebar.tsx`, `LineSpacingControl.tsx`
   - 工作量：1 小时

7. **图片提供商配置**
   - 影响：扩展性
   - 文件：`image-upload.ts`
   - 工作量：1 小时

---

## 四、重构步骤建议

### Phase 1: 创建常量文件（1-2 小时）

```bash
# 1. 创建常量文件
touch lib/constants/index.ts

# 2. 创建配置文件
touch config/image-providers.ts
```

### Phase 2: 替换硬编码值（2-3 小时）

按优先级顺序逐个文件替换：

1. `toast.ts` - 错误消息
2. `ImageUploader.tsx` - API 端点、超时、错误消息
3. `ai-config.ts` - API 端点
4. `LineSpacingControl.tsx` - 行间距配置
5. `OutlineNode.tsx` - 行间距类名
6. `Sidebar.tsx` - 按钮尺寸

### Phase 3: 测试验证（1 小时）

- [ ] 功能测试：确保所有功能正常
- [ ] 单元测试：验证常量值正确
- [ ] TypeScript 检查：确保类型正确

---

## 五、总结

### 统计

| 类型 | 数量 |
|------|------|
| 魔法数字 | 6 处 |
| API 端点 | 3 处 |
| localStorage 键名 | 1 处 |
| 错误消息 | 10+ 处 |
| 默认值 | 3 处 |
| 配置值 | 2 处 |
| **总计** | **25+ 处** |

### 预期收益

✅ **可维护性提升**：集中管理配置，修改更容易
✅ **类型安全**：TypeScript 类型检查，减少错误
✅ **国际化准备**：文本集中管理，易于国际化
✅ **环境切换**：配置集中，便于不同环境切换
✅ **代码复用**：避免重复定义

### 预计工作量

- **高优先级**：3-4 小时
- **中优先级**：2-3 小时
- **低优先级**：2 小时
- **总计**：7-9 小时

---

**报告生成时间：** 2026-02-08
**扫描工具：** Claude Code Agent
**置信度：** 高

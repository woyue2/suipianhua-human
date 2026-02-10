/**
 * 提示词类型定义
 * 支持多套提示词和自定义提示词
 */

/**
 * 提示词模板基础接口
 */
export interface BasePromptTemplate {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 分类标签 */
  category: 'default' | 'academic' | 'meeting' | 'project' | 'custom';
  /** 适合场景说明 */
  scenario?: string;
}

/**
 * 系统提示词模板
 */
export interface SystemPromptTemplate extends BasePromptTemplate {
  /** 系统提示词内容 */
  systemPrompt: string;
  /** 默认温度参数 */
  temperature?: number;
  /** 默认模型覆盖 */
  model?: string;
  /** 期望的输出格式说明 */
  outputFormat?: string;
}

/**
 * 完整提示词模板（含用户消息模板）
 */
export interface FullPromptTemplate extends SystemPromptTemplate {
  /** 用户消息模板（支持变量插值） */
  userPromptTemplate?: string;
  /** 变量定义 */
  variables?: PromptVariable[];
  /** 示例输入输出 */
  examples?: PromptExample[];
}

/**
 * 提示词变量
 */
export interface PromptVariable {
  key: string;
  placeholder: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

/**
 * 提示词示例
 */
export interface PromptExample {
  input: string;
  output: string;
  explanation?: string;
}

/**
 * 提示词配置（持久化结构）
 */
export interface PromptConfig {
  /** 当前激活的提示词ID */
  activePromptId: string;
  /** 自定义提示词集合 */
  customPrompts: SystemPromptTemplate[];
  /** 用户偏好设置 */
  preferences: PromptPreferences;
}

/**
 * 提示词偏好设置
 */
export interface PromptPreferences {
  /** 自动保存自定义提示词 */
  autoSave: boolean;
  /** 提示词变更时显示预览 */
  showPreview: boolean;
  /** 确认危险操作 */
  confirmDangerous: boolean;
}

/**
 * API 请求结构扩展
 */
export interface AIReorganizeRequestWithPrompt {
  content: string;
  provider?: 'openai' | 'zhipu';
  model?: string;
  promptId?: string;
  customPrompt?: string;
  customSystemPrompt?: string;
  temperature?: number;
}

/**
 * 提示词验证结果
 */
export interface PromptValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

/**
 * 提示词列表响应
 */
export interface PromptListResponse {
  builtIn: SystemPromptTemplate[];
  custom: SystemPromptTemplate[];
}

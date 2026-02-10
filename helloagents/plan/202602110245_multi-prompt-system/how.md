# 多套提示词系统 - 技术设计

## 架构概览

```
tree-index/
├── lib/
│   └── prompts/                    # 新增：提示词管理模块
│       ├── index.ts               # 统一导出
│       ├── types.ts               # 类型定义
│       ├── manager.ts             # 提示词管理器
│       ├── defaults/              # 内置提示词集
│       │   ├── index.ts
│       │   ├── reorganize.ts
│       │   ├── summarize.ts
│       │   └── expand.ts
│       └── templates/             # 场景模板
│           ├── index.ts
│           ├── academic.ts
│           ├── meeting.ts
│           └── project.ts
├── types/
│   └── index.ts                   # 新增 PromptConfig 类型
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── prompt/            # 新增：提示词相关 API
│   │           ├── route.ts       # 提示词 CRUD
│   │           └── validate.ts    # 提示词验证
│   └── actions/
│       └── prompts.ts             # Server Actions
├── components/
│   └── settings/                 # 新增：设置组件
│       ├── PromptSelector.tsx    # 提示词选择器
│       ├── PromptEditor.tsx      # 自定义提示词编辑器
│       └── PromptPreview.tsx     # 提示词预览
└── hooks/
    └── usePromptConfig.ts         # 新增：提示词状态 Hook
```

## 核心类型定义

```typescript
// lib/prompts/types.ts

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
  userPromptTemplate: string;
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
  promptId?: string;              // 使用预设提示词
  customPrompt?: string;          // 使用自定义提示词（优先级更高）
  customSystemPrompt?: string;    // 完整自定义系统提示词
  temperature?: number;
}

/**
 * 提示词验证结果
 */
export interface PromptValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;  // 质量评分 0-100
}
```

## 核心模块设计

### 1. 提示词管理器 (PromptManager)

```typescript
// lib/prompts/manager.ts

import {
  SystemPromptTemplate,
  PromptConfig,
  PromptValidationResult
} from './types';
import { DEFAULT_PROMPTS } from './defaults';
import { SCENARIO_PROMPTS } from './templates';

class PromptManager {
  private config: PromptConfig;
  private builtInPrompts: Map<string, SystemPromptTemplate>;

  constructor() {
    this.builtInPrompts = new Map();
    this.config = this.loadConfig();
    this.initializeBuiltInPrompts();
  }

  /**
   * 初始化内置提示词
   */
  private initializeBuiltInPrompts() {
    // 合并所有内置提示词
    const allBuiltIn = [
      ...DEFAULT_PROMPTS,
      ...SCENARIO_PROMPTS
    ];

    for (const prompt of allBuiltIn) {
      this.builtInPrompts.set(prompt.id, prompt);
    }
  }

  /**
   * 获取提示词模板
   */
  getPrompt(id: string): SystemPromptTemplate | null {
    // 先查找自定义提示词
    const custom = this.config.customPrompts.find(p => p.id === id);
    if (custom) return custom;

    // 再查找内置提示词
    return this.builtInPrompts.get(id) || null;
  }

  /**
   * 获取所有提示词（分类）
   */
  getAllPrompts(): {
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  } {
    return {
      builtIn: Array.from(this.builtInPrompts.values()),
      custom: this.config.customPrompts
    };
  }

  /**
   * 根据分类获取提示词
   */
  getPromptsByCategory(category: string): SystemPromptTemplate[] {
    const all = this.getAllPrompts();
    return [...all.builtIn, ...all.custom].filter(p => p.category === category);
  }

  /**
   * 添加自定义提示词
   */
  addCustomPrompt(prompt: Omit<SystemPromptTemplate, 'id'>): SystemPromptTemplate {
    const id = `custom-${Date.now()}`;
    const newPrompt: SystemPromptTemplate = {
      ...prompt,
      id,
      category: 'custom'
    };

    this.config.customPrompts.push(newPrompt);
    this.saveConfig();

    return newPrompt;
  }

  /**
   * 更新自定义提示词
   */
  updateCustomPrompt(id: string, updates: Partial<SystemPromptTemplate>): boolean {
    const index = this.config.customPrompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.config.customPrompts[index] = {
      ...this.config.customPrompts[index],
      ...updates
    };

    this.saveConfig();
    return true;
  }

  /**
   * 删除自定义提示词
   */
  deleteCustomPrompt(id: string): boolean {
    const index = this.config.customPrompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.config.customPrompts.splice(index, 1);

    // 如果删除的是当前激活的，重置为默认
    if (this.config.activePromptId === id) {
      this.config.activePromptId = 'reorganize-default';
    }

    this.saveConfig();
    return true;
  }

  /**
   * 验证提示词有效性
   */
  validatePrompt(prompt: Partial<SystemPromptTemplate>): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // 必填字段验证
    if (!prompt.name?.trim()) {
      errors.push('名称不能为空');
      score -= 20;
    }

    if (!prompt.systemPrompt?.trim()) {
      errors.push('系统提示词不能为空');
      score -= 30;
    }

    // 质量检查
    if (prompt.systemPrompt && prompt.systemPrompt.length < 50) {
      warnings.push('系统提示词过短，可能无法提供清晰指导');
      score -= 10;
    }

    if (prompt.systemPrompt && !/[\。\？\！]/.test(prompt.systemPrompt)) {
      warnings.push('建议在提示词中添加标点符号以增强表达');
      score -= 5;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * 渲染提示词模板（变量替换）
   */
  renderTemplate(
    template: SystemPromptTemplate,
    variables: Record<string, string>
  ): { systemPrompt: string } {
    let systemPrompt = template.systemPrompt;

    for (const [key, value] of Object.entries(variables)) {
      systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return { systemPrompt };
  }

  /**
   * 加载配置
   */
  private loadConfig(): PromptConfig {
    if (typeof window === 'undefined') {
      // Server-side default
      return {
        activePromptId: 'reorganize-default',
        customPrompts: [],
        preferences: {
          autoSave: true,
          showPreview: true,
          confirmDangerous: true
        }
      };
    }

    try {
      const saved = localStorage.getItem('ai-prompt-config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load prompt config:', e);
    }

    return this.getDefaultConfig();
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('ai-prompt-config', JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save prompt config:', e);
    }
  }

  private getDefaultConfig(): PromptConfig {
    return {
      activePromptId: 'reorganize-default',
      customPrompts: [],
      preferences: {
        autoSave: true,
        showPreview: true,
        confirmDangerous: true
      }
    };
  }
}

// Singleton instance
export const promptManager = new PromptManager();
```

### 2. 内置提示词集

```typescript
// lib/prompts/defaults/reorganize.ts

import { SystemPromptTemplate } from '../types';

export const DEFAULT_REORGANIZE_PROMPTS: SystemPromptTemplate[] = [
  {
    id: 'reorganize-default',
    name: '智能重组',
    description: '自动识别主题，创建层级分类',
    category: 'default',
    scenario: '日常笔记整理',
    systemPrompt: `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 保持原有内容不变，只调整层级关系
4. 保留所有格式标记（斜体*text*，粗体**text**）
5. 只返回JSON格式`,
    temperature: 0.7,
    outputFormat: 'JSON'
  },
  {
    id: 'reorganize-simple',
    name: '简单整理',
    description: '基础层级整理，不过度智能',
    category: 'default',
    scenario: '快速整理',
    systemPrompt: `将以下内容按逻辑分组，保持原有信息不变。

只需要：
- 识别相关主题
- 创建合适的分类
- 保持信息完整`,
    temperature: 0.3,
    outputFormat: 'JSON'
  },
  {
    id: 'reorganize-detailed',
    name: '详细整理',
    description: '深度分析，创建细粒度分类',
    category: 'default',
    scenario: '复杂内容整理',
    systemPrompt: `你是一位专业的知识整理专家。请对以下内容进行深度分析和整理。

分析维度：
1. 主题识别：识别核心概念和关键词
2. 层级设计：设计合理的分类体系（建议3-5层）
3. 逻辑关系：明确同级和跨级内容的逻辑关系
4. 要点提取：提取关键信息，简化冗余表达
5. 补充建议：对不完整的信息给出补充建议`,
    temperature: 0.8,
    outputFormat: 'JSON'
  }
];

export const SCENARIO_PROMPTS: SystemPromptTemplate[] = [
  {
    id: 'reorganize-academic',
    name: '学术风格',
    description: '适合学术论文大纲整理',
    category: 'academic',
    scenario: '论文大纲',
    systemPrompt: `你是一位资深的学术编辑。请将以下内容整理成规范的学术论文结构。

论文结构要求：
1. 研究背景（Background）：阐述研究领域的现状和问题
2. 研究目标（Objective）：明确本研究要解决的核心问题
3. 研究方法（Methods）：描述采用的方法论
4. 实验结果（Results）：呈现主要发现
5. 讨论分析（Discussion）：解释结果的意义
6. 结论展望（Conclusion）：总结并指出未来方向

注意事项：
- 使用学术语言
- 保持逻辑严谨
- 突出创新点`,
    temperature: 0.5,
    outputFormat: 'JSON'
  },
  {
    id: 'reorganize-meeting',
    name: '会议纪要',
    description: '适合会议内容整理和纪要生成',
    category: 'meeting',
    scenario: '会议记录',
    systemPrompt: `你是一位专业的会议记录助手。请将以下会议内容整理成结构化的会议纪要。

整理要求：
1. 提取会议主题和讨论要点
2. 识别并标注不同发言人的观点
3. 提取行动项（Action Items）
4. 标注决策点（Decisions Made）
5. 记录待讨论事项（Open Questions）
6. 标记重要时间节点和承诺`,
    temperature: 0.4,
    outputFormat: 'JSON'
  },
  {
    id: 'reorganize-project',
    name: '项目管理',
    description: '适合项目规划和任务分解',
    category: 'project',
    scenario: '项目规划',
    systemPrompt: `你是一位经验丰富的项目经理。请将以下内容整理成可执行的项目计划。

整理框架：
1. 项目目标（Objective）
2. 关键里程碑（Milestones）
3. 任务分解（Tasks）
4. 依赖关系（Dependencies）
5. 资源需求（Resources）
6. 风险评估（Risks）

产出要求：
- 每个任务应有明确的输入和输出
- 标注任务的优先级（P0/P1/P2）
- 识别关键路径`,
    temperature: 0.6,
    outputFormat: 'JSON'
  },
  {
    id: 'reorganize-study',
    name: '学习笔记',
    description: '适合知识整理和学习笔记',
    category: 'default',
    scenario: '学习整理',
    systemPrompt: `你是一位知识管理专家。请将以下学习内容整理成结构化的学习笔记。

整理结构：
1. 核心概念（Key Concepts）
2. 知识点详解（Details）
3. 示例说明（Examples）
4. 练习题（Practice Questions）
5. 延伸阅读（Further Reading）
6. 常见问题（FAQ）

目标：帮助学习者快速理解和掌握主题`,
    temperature: 0.7,
    outputFormat: 'JSON'
  }
];
```

### 3. API 层设计

```typescript
// app/api/ai/prompt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { promptManager } from '@/lib/prompts/manager';
import { promptValidationSchema } from './validate';

// GET /api/ai/prompt - 获取所有提示词
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let prompts;

    if (category) {
      prompts = promptManager.getPromptsByCategory(category);
    } else {
      const all = promptManager.getAllPrompts();
      prompts = {
        builtIn: all.builtIn,
        custom: all.custom
      };
    }

    return NextResponse.json({
      success: true,
      data: prompts
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/ai/prompt - 创建自定义提示词
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证请求体
    const validationResult = promptValidationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        errors: validationResult.error.flatten()
      }, { status: 400 });
    }

    const newPrompt = promptManager.addCustomPrompt(validationResult.data);

    return NextResponse.json({
      success: true,
      data: newPrompt
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/ai/prompt - 更新自定义提示词
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing prompt ID'
      }, { status: 400 });
    }

    const success = promptManager.updateCustomPrompt(id, updates);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt updated'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/ai/prompt - 删除自定义提示词
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing prompt ID'
      }, { status: 400 });
    }

    const success = promptManager.deleteCustomPrompt(id);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### 4. 修改现有 AI API 以支持提示词选择

```typescript
// app/api/ai/reorganize/route.ts (修改后)

import { NextRequest } from 'next/server';
import {
  handleApiError,
  parseAndValidateBody,
  createSuccessResponse,
} from '@/lib/api-utils';
import { AIReorganizeRequestSchema } from '@/lib/validation';
import { promptManager } from '@/lib/prompts/manager';

export async function POST(req: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await req.json();

    // 2. 获取提示词
    let systemPrompt: string;
    let temperature = body.temperature ?? 0.7;

    if (body.customSystemPrompt) {
      // 优先级1：用户提供的完整自定义提示词
      systemPrompt = body.customSystemPrompt;
    } else if (body.customPrompt) {
      // 优先级2：用户提供的提示词 ID，获取对应模板
      const template = promptManager.getPrompt(body.customPrompt);
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Prompt not found'
        }, { status: 404 });
      }
      systemPrompt = template.systemPrompt;
      if (template.temperature) {
        temperature = template.temperature;
      }
    } else if (body.promptId) {
      // 优先级3：使用预设提示词 ID
      const template = promptManager.getPrompt(body.promptId);
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Prompt not found'
        }, { status: 404 });
      }
      systemPrompt = template.systemPrompt;
      if (template.temperature) {
        temperature = template.temperature;
      }
    } else {
      // 优先级4：使用默认提示词
      const defaultPrompt = promptManager.getPrompt('reorganize-default');
      systemPrompt = defaultPrompt?.systemPrompt ?? getDefaultSystemPrompt();
    }

    // 3. 构建完整的提示词
    const fullPrompt = `${systemPrompt}

原始内容：
${body.content}

请返回重组后的结构，包含：
- reasoning: 重组的理由说明
- newStructure: 新的树形结构`;

    // 4. 调用 AI API
    let result;
    const provider = body.provider ?? 'zhipu';
    const model = body.model ?? 'glm-4-flash';

    if (provider === 'zhipu') {
      result = await callZhipuAI(fullPrompt, model, temperature);
    } else {
      result = await callOpenAI(fullPrompt, model, temperature);
    }

    return createSuccessResponse({
      reasoning: result.reasoning,
      newStructure: result.newStructure,
      provider,
      model,
      temperature,
      usedPromptId: body.promptId ?? (body.customPrompt ?? 'custom')
    });
  } catch (error: unknown) {
    console.error('❌ AI Error:', error);
    return handleApiError(error);
  }
}
```

### 5. 前端组件设计

#### 5.1 提示词选择器组件

```tsx
// components/settings/PromptSelector.tsx

'use client';

import { useState, useEffect } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';
import PromptPreview from './PromptPreview';

interface PromptSelectorProps {
  value: string;
  onChange: (promptId: string) => void;
  className?: string;
}

export default function PromptSelector({
  value,
  onChange,
  className = ''
}: PromptSelectorProps) {
  const [prompts, setPrompts] = useState<{
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  }>({ builtIn: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPromptTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadPrompts() {
      try {
        const res = await fetch('/api/ai/prompt');
        const data = await res.json();
        if (data.success) {
          setPrompts(data.data);
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPrompts();
  }, []);

  useEffect(() => {
    if (value) {
      const all = [...prompts.builtIn, ...prompts.custom];
      setSelectedPrompt(all.find(p => p.id === value) || null);
    }
  }, [value, prompts]);

  const categories = [
    { key: 'default', label: '默认模板' },
    { key: 'academic', label: '学术风格' },
    { key: 'meeting', label: '会议纪要' },
    { key: 'project', label: '项目管理' },
    { key: 'custom', label: '自定义' }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        选择提示词模板
      </label>

      {loading ? (
        <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
      ) : (
        <>
          {/* 分类标签 */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  // 滚动到对应分类
                  document.getElementById(`category-${cat.key}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 提示词列表 */}
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
            {/* 内置提示词 */}
            {prompts.builtIn.map(prompt => (
              <div
                key={prompt.id}
                id={`category-${prompt.category}`}
                className={`p-3 cursor-pointer hover:bg-blue-50 transition ${
                  value === prompt.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onChange(prompt.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{prompt.name}</h4>
                    <p className="text-sm text-gray-500">{prompt.description}</p>
                    {prompt.scenario && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 rounded">
                        {prompt.scenario}
                      </span>
                    )}
                  </div>
                  {value === prompt.id && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </div>
            ))}

            {/* 自定义提示词 */}
            {prompts.custom.length > 0 && (
              <>
                <div className="px-3 py-2 bg-gray-50 font-medium text-sm sticky top-0">
                  自定义模板
                </div>
                {prompts.custom.map(prompt => (
                  <div
                    key={prompt.id}
                    className={`p-3 cursor-pointer hover:bg-blue-50 transition ${
                      value === prompt.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => onChange(prompt.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{prompt.name}</h4>
                        <p className="text-sm text-gray-500">{prompt.description}</p>
                      </div>
                      {value === prompt.id && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 预览按钮 */}
          {selectedPrompt && (
            <button
              onClick={() => setShowPreview(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              预览提示词内容
            </button>
          )}

          {/* 预览弹窗 */}
          {showPreview && selectedPrompt && (
            <PromptPreview
              prompt={selectedPrompt}
              onClose={() => setShowPreview(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
```

#### 5.2 自定义提示词编辑器

```tsx
// components/settings/PromptEditor.tsx

'use client';

import { useState } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';

interface PromptEditorProps {
  prompt?: SystemPromptTemplate;
  onSave: (prompt: Omit<SystemPromptTemplate, 'id'>) => void;
  onCancel: () => void;
}

export default function PromptEditor({
  prompt,
  onSave,
  onCancel
}: PromptEditorProps) {
  const [formData, setFormData] = useState({
    name: prompt?.name ?? '',
    description: prompt?.description ?? '',
    systemPrompt: prompt?.systemPrompt ?? '',
    temperature: prompt?.temperature ?? 0.7,
    outputFormat: prompt?.outputFormat ?? 'JSON'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // 基本验证
    const newErrors: string[] = [];
    if (!formData.name.trim()) {
      newErrors.push('名称不能为空');
    }
    if (!formData.systemPrompt.trim()) {
      newErrors.push('系统提示词不能为空');
    }
    if (formData.systemPrompt.length < 50) {
      newErrors.push('系统提示词至少需要50个字符');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">
        {prompt ? '编辑自定义提示词' : '创建自定义提示词'}
      </h3>

      {/* 名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          名称 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="给提示词起个名字"
        />
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描述
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="描述这个提示词的用途"
        />
      </div>

      {/* 系统提示词 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          系统提示词 *
        </label>
        <textarea
          value={formData.systemPrompt}
          onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[200px]"
          placeholder="输入系统提示词..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.systemPrompt.length} 字符
          {formData.systemPrompt.length < 50 && '（至少需要50个字符）'}
        </p>
      </div>

      {/* 温度参数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Temperature: {formData.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={formData.temperature}
          onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>精确 (0.0)</span>
          <span>平衡 (0.7)</span>
          <span>创意 (1.0)</span>
        </div>
      </div>

      {/* 输出格式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          期望输出格式
        </label>
        <select
          value={formData.outputFormat}
          onChange={e => setFormData({ ...formData, outputFormat: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="JSON">JSON</option>
          <option value="Markdown">Markdown</option>
          <option value="Plain">Plain Text</option>
        </select>
      </div>

      {/* 错误提示 */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
```

## 数据持久化设计

### 本地存储结构

```typescript
// localStorage key: 'ai-prompt-config'

interface StoredPromptConfig {
  activePromptId: string;
  customPrompts: SystemPromptTemplate[];
  preferences: {
    autoSave: boolean;
    showPreview: boolean;
    confirmDangerous: boolean;
  };
  // 版本控制
  version: string;
  lastModified: string;
}

// 数据迁移示例
function migrateConfig(oldConfig: any): StoredPromptConfig {
  return {
    ...oldConfig,
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    preferences: {
      autoSave: oldConfig.autoSave ?? true,
      showPreview: oldConfig.showPreview ?? true,
      confirmDangerous: oldConfig.confirmDangerous ?? true
    }
  };
}
```

### 导入/导出功能

```typescript
// 导出为 JSON 文件
function exportPrompts(config: PromptConfig): string {
  return JSON.stringify(config, null, 2);
}

// 导入验证
function importPrompts(jsonString: string): { success: boolean; data?: PromptConfig; error?: string } {
  try {
    const data = JSON.parse(jsonString);

    // 验证结构
    if (!data.activePromptId) {
      return { success: false, error: '缺少 activePromptId' };
    }

    // 验证自定义提示词
    if (data.customPrompts) {
      for (const prompt of data.customPrompts) {
        if (!prompt.id || !prompt.name || !prompt.systemPrompt) {
          return { success: false, error: `提示词 "${prompt.name}" 缺少必要字段` };
        }
      }
    }

    return { success: true, data };
  } catch (e) {
    return { success: false, error: 'JSON 格式错误' };
  }
}
```

## 安全考虑

### 提示词注入防护

```typescript
// 对用户输入的提示词进行基本过滤
function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/[\x00-\x1F\x7F]/g, '')  // 移除控制字符
    .trim()
    .slice(0, 10000);  // 限制长度
}

// 敏感内容检测
function containsSensitiveContent(prompt: string): boolean {
  const sensitivePatterns = [
    /system\s*:\s*you\s+are/i,
    /ignore\s+(previous|above)\s+instructions/i,
    /jailbreak/i,
    /dan\s*mode/i
  ];

  return sensitivePatterns.some(pattern => pattern.test(prompt));
}
```

## 性能优化

### 缓存策略

- 提示词列表缓存在客户端
- 使用 React.memo 避免不必要的重渲染
- 大提示词使用 useMemo 缓存

### 懒加载

```typescript
// 提示词编辑器按需加载
const PromptEditor = lazy(() => import('./PromptEditor'));
const PromptPreview = lazy(() => import('./PromptPreview'));

// 使用 Suspense 包裹
<Suspense fallback={<Loading />}>
  <PromptEditor ... />
</Suspense>
```

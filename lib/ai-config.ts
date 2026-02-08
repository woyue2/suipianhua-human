/**
 * AI 模型配置
 * 支持多个 AI 提供商
 */

import { createOpenAI } from '@ai-sdk/openai';

// AI 提供商类型
export type AIProvider = 'openai' | 'zhipu';

// 可用的模型列表
export const AI_MODELS = {
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '快速且经济' },
    { id: 'gpt-4o', name: 'GPT-4o', description: '高性能模型' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经典模型' },
  ],
  zhipu: [
    { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '免费快速' },
    { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '高性能' },
    { id: 'glm-4-air', name: 'GLM-4 Air', description: '轻量级' },
    { id: 'glm-4.6-all', name: 'GLM-4.6 All', description: '最新旗舰' },
  ],
} as const;

/**
 * 创建 AI 模型实例
 */
export function createAIModel(provider: AIProvider, model: string) {
  switch (provider) {
    case 'zhipu': {
      // 智谱 AI 使用 OpenAI 兼容的 API
      const apiKey = process.env.ZHIPU_API_KEY;
      if (!apiKey) {
        throw new Error('ZHIPU_API_KEY 环境变量未设置');
      }

      // 智谱 AI 的 API 端点
      const zhipuClient = createOpenAI({
        baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
        apiKey,
      });

      // 对于 GLM-4.6，需要使用 chat completions
      const instance = zhipuClient(model);

      return instance;
    }

    case 'openai':
    default: {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY 环境变量未设置');
      }

      const { openai } = require('@ai-sdk/openai');
      return openai(model);
    }
  }
}

/**
 * 获取默认 AI 提供商
 * 优先使用已配置 API Key 的提供商
 */
export function getDefaultProvider(): AIProvider {
  if (process.env.ZHIPU_API_KEY) {
    return 'zhipu';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  // 默认使用智谱 AI
  return 'zhipu';
}

/**
 * 获取提供商的默认模型
 */
export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'zhipu':
      return 'glm-4-flash'; // 免费模型
    case 'openai':
    default:
      return 'gpt-4o-mini';
  }
}

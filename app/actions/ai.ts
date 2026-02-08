'use server'

import { streamObject } from 'ai';
import { ReorganizeResultSchema } from '@/lib/ai-schema';
import { OutlineNode } from '@/types';
import { createAIModel, getDefaultProvider, getDefaultModel, AI_MODELS } from '@/lib/ai-config';

/**
 * AI 大纲重组
 * 使用默认的 AI 提供商和模型
 */
export async function reorganizeOutline(currentTree: OutlineNode) {
  const provider = getDefaultProvider();
  const model = getDefaultModel(provider);

  return reorganizeOutlineWithConfig(currentTree, provider, model);
}

/**
 * AI 大纲重组（指定配置）
 * 允许自定义 AI 提供商和模型
 */
export async function reorganizeOutlineWithConfig(
  currentTree: OutlineNode,
  provider: 'openai' | 'zhipu',
  model: string
) {
  const plainTextTree = extractContentFromTree(currentTree);

  const aiModel = createAIModel(provider, model);

  const result = await streamObject({
    model: aiModel,
    schema: ReorganizeResultSchema,
    prompt: `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID

原始内容：
${JSON.stringify(plainTextTree)}`,
  });

  // Wait for the result to complete and get the full object
  const { object } = await result;

  return object;
}

function extractContentFromTree(node: OutlineNode): any {
  return {
    content: node.content,
    children: node.children.map(extractContentFromTree),
  };
}

/**
 * 获取可用的 AI 提供商和模型列表
 */
export async function getAvailableAIModels() {
  return AI_MODELS;
}

'use server'

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

  let result;

  if (provider === 'zhipu') {
    // 智谱AI使用直接HTTP调用
    result = await callZhipuAI(plainTextTree, model);
  } else {
    // OpenAI使用 Vercel AI SDK
    result = await callOpenAI(plainTextTree, model);
  }

  return result;
}

/**
 * 调用智谱AI API (Server Actions版本)
 */
async function callZhipuAI(plainTextTree: any, model: string) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未设置');
  }

  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  const prompt = `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID

原始内容：
${JSON.stringify(plainTextTree)}

请返回重组后的结构，必须严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "reasoning": "重组的理由说明",
  "newStructure": {
    "content": "根节点内容",
    "children": [
      {
        "content": "子节点内容",
        "children": []
      }
    ]
  }
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }, // 强制JSON格式
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ ZhipuAI API Error:', errorText);
    throw new Error(`智谱AI调用失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析JSON响应
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ JSON Parse Error:', content);
    throw new Error('AI返回的不是有效的JSON格式');
  }
}

/**
 * 调用 OpenAI API (使用 Vercel AI SDK)
 */
async function callOpenAI(plainTextTree: any, model: string) {
  const { streamObject } = await import('ai');
  const { ReorganizeResultSchema } = await import('@/lib/ai-schema');

  const aiModel = createAIModel('openai', model);

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

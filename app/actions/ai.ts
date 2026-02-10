'use server'

import { OutlineNode } from '@/types';
import { AIOutlineNode } from '@/lib/ai-schema';
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

import { promptManager } from '@/lib/prompts/manager';

/**
 * AI 大纲重组（指定配置）
 * 允许自定义 AI 提供商和模型
 */
export async function reorganizeOutlineWithConfig(
  currentTree: OutlineNode,
  provider: 'openai' | 'zhipu',
  model: string,
  promptId?: string
) {
  // 保留格式信息的提取
  const plainTextTree = extractContentFromTree(currentTree);

  // 获取提示词
  let systemPrompt: string;
  let temperature = 0.7;

  if (promptId) {
    const template = promptManager.getPrompt(promptId);
    if (template) {
      systemPrompt = template.systemPrompt;
      if (template.temperature) {
        temperature = template.temperature;
      }
    } else {
      // 如果找不到指定ID，使用默认
      const defaultPrompt = promptManager.getPrompt('reorganize-default');
      systemPrompt = defaultPrompt?.systemPrompt || getDefaultSystemPrompt();
    }
  } else {
    // 未指定ID，尝试获取默认
    const defaultPrompt = promptManager.getPrompt('reorganize-default');
    systemPrompt = defaultPrompt?.systemPrompt || getDefaultSystemPrompt();
  }

  let result;

  if (provider === 'zhipu') {
    // 智谱AI使用直接HTTP调用
    result = await callZhipuAI(plainTextTree, model, systemPrompt, temperature);
  } else {
    // OpenAI使用 Vercel AI SDK
    result = await callOpenAI(plainTextTree, model, systemPrompt, temperature);
  }

  return result;
}

function getDefaultSystemPrompt(): string {
  return `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构
4. **重要：保留所有格式标记！** 粗体用 **text**，斜体用 *text*
5. 保持原有内容不变，只调整层级关系`;
}

/**
 * 提取树结构内容，**保留格式标记**
 */
function extractContentFromTree(node: OutlineNode): AIOutlineNode {
  // 构建带格式的内容
  let formattedContent = node.content || '';

  // 添加格式标记到内容中
  if (node.isItalic) {
    formattedContent = `*${formattedContent}*`; // 斜体
  }

  return {
    content: formattedContent,
    isHeader: node.isHeader,
    isSubHeader: node.isSubHeader,
    tags: node.tags,
    isItalic: node.isItalic,
    icon: node.icon,
    children: node.children.map(extractContentFromTree),
  };
}

/**
 * 调用智谱AI API (Server Actions版本)
 */
type ReorganizeResult = {
  reasoning: string;
  newStructure: AIOutlineNode;
};

async function callZhipuAI(
  plainTextTree: AIOutlineNode, 
  model: string,
  systemPrompt: string,
  temperature: number
): Promise<ReorganizeResult> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未设置');
  }

  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  const fullPrompt = `${systemPrompt}

原始数据（包含格式信息）：
${JSON.stringify(plainTextTree, null, 2)}

请返回重组后的结构，必须严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "reasoning": "重组的理由说明",
  "newStructure": {
    "content": "根节点内容（保留格式标记）",
    "isHeader": false,
    "isSubHeader": false,
    "tags": ["tag1"],
    "isItalic": false,
    "children": []
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
          content: fullPrompt,
        },
      ],
      temperature: temperature,
      response_format: { type: 'json_object' }, // 强制JSON格式
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ ZhipuAI API Error:', errorText);
    throw new Error(`智谱AI调用失败: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const responseContent = data.choices?.[0]?.message?.content;
  if (!responseContent) {
    throw new Error('AI 返回内容为空');
  }

  // 解析JSON响应
  try {
    return JSON.parse(responseContent) as ReorganizeResult;
  } catch {
    console.error('❌ JSON Parse Error:', responseContent);
    throw new Error('AI返回的不是有效的JSON格式');
  }
}

/**
 * 调用 OpenAI API (使用 Vercel AI SDK)
 */
async function callOpenAI(
  plainTextTree: AIOutlineNode, 
  model: string,
  systemPrompt: string,
  temperature: number
) {
  const { streamObject } = await import('ai');
  const { ReorganizeResultSchema } = await import('@/lib/ai-schema');

  const aiModel = createAIModel('openai', model);

  const result = await streamObject({
    model: aiModel,
    schema: ReorganizeResultSchema,
    system: systemPrompt,
    prompt: `原始数据：
${JSON.stringify(plainTextTree, null, 2)}`,
    temperature: temperature,
  });

  // Wait for the result to complete and get the full object
  const { object } = await result;

  return object;
}

/**
 * 获取可用的 AI 提供商和模型列表
 */
export async function getAvailableAIModels() {
  return AI_MODELS;
}

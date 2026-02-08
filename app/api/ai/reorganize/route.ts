import { NextRequest } from 'next/server';
import {
  handleApiError,
  parseAndValidateBody,
  createSuccessResponse,
} from '@/lib/api-utils';
import { AIReorganizeRequestSchema } from '@/lib/validation';

/**
 * POST /api/ai/reorganize
 *
 * AI 大纲重组接口
 * 支持多个 AI 提供商 (OpenAI, 智谱AI)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 解析并验证请求体
    const { content, provider, model, temperature } = await parseAndValidateBody(
      req,
      AIReorganizeRequestSchema
    );

    console.log(`📤 AI Request: provider=${provider}, model=${model}`);

    // 2. 调用 AI API
    let result;

    if (provider === 'zhipu') {
      // 智谱AI使用直接HTTP调用
      result = await callZhipuAI(content, model, temperature);
    } else {
      // OpenAI使用 Vercel AI SDK
      result = await callOpenAI(content, model, temperature);
    }

    console.log(`✅ AI Response received`);

    // 3. 返回结果
    return createSuccessResponse({
      reasoning: result.reasoning,
      newStructure: result.newStructure,
      provider,
      model,
      temperature,
    });
  } catch (error: any) {
    console.error('❌ AI Error:', error);
    return handleApiError(error);
  }
}

/**
 * 调用智谱AI API
 */
async function callZhipuAI(content: string, model: string, temperature: number) {
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
4. 保持原有内容不变，只调整层级关系

原始内容：
${content}

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
      temperature,
      response_format: { type: 'json_object' }, // 强制JSON格式
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ ZhipuAI API Error:', errorText);
    throw new Error(`智谱AI调用失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const responseContent = data.choices[0].message.content;

  // 解析JSON响应
  try {
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('❌ JSON Parse Error:', responseContent);
    throw new Error('AI返回的不是有效的JSON格式');
  }
}

/**
 * 调用 OpenAI API (使用 Vercel AI SDK)
 */
async function callOpenAI(content: string, model: string, temperature: number) {
  const { generateObject } = await import('ai');
  const { createAIModel } = await import('@/lib/ai-config');
  const { ReorganizeResultSchema } = await import('@/lib/ai-schema');

  const aiModel = createAIModel('openai', model);

  const prompt = `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID
4. 保持原有内容不变，只调整层级关系

原始内容：
${content}

请返回重组后的结构，包含：
- reasoning: 重组的理由说明
- newStructure: 新的树形结构`;

  const result = await generateObject({
    model: aiModel,
    schema: ReorganizeResultSchema,
    prompt,
    temperature,
  });

  return result.object;
}

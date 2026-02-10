import { NextRequest, NextResponse } from 'next/server';
import {
  handleApiError,
  parseAndValidateBody,
  createSuccessResponse,
} from '@/lib/api-utils';
import { AIReorganizeRequestSchema } from '@/lib/validation';
import { promptManager } from '@/lib/prompts/manager';

/**
 * POST /api/ai/reorganize
 *
 * AI 大纲重组接口
 * 支持多个 AI 提供商 (OpenAI, 智谱AI)
 * 支持提示词模板选择和自定义提示词
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 解析并验证请求体
    const body = await parseAndValidateBody(
      req,
      AIReorganizeRequestSchema
    );

    const { content, provider, model, temperature, promptId, customPrompt, customSystemPrompt } = body;

    console.log(`📤 AI Request: provider=${provider}, model=${model}, promptId=${promptId || 'default'}`);

    // 2. 获取提示词
    let systemPrompt: string;
    let usedTemperature = temperature ?? 0.7;

    if (customSystemPrompt) {
      // 优先级1：用户提供的完整自定义提示词
      systemPrompt = customSystemPrompt;
    } else if (customPrompt) {
      // 优先级2：用户提供的提示词 ID，获取对应模板
      const template = promptManager.getPrompt(customPrompt);
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Prompt not found'
        }, { status: 404 });
      }
      systemPrompt = template.systemPrompt;
      if (template.temperature) {
        usedTemperature = template.temperature;
      }
    } else if (promptId) {
      // 优先级3：使用预设提示词 ID
      const template = promptManager.getPrompt(promptId);
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Prompt not found'
        }, { status: 404 });
      }
      systemPrompt = template.systemPrompt;
      if (template.temperature) {
        usedTemperature = template.temperature;
      }
    } else {
      // 优先级4：使用默认提示词
      const defaultPrompt = promptManager.getPrompt('reorganize-default');
      systemPrompt = defaultPrompt?.systemPrompt ?? getDefaultSystemPrompt();
    }

    // 3. 调用 AI API
    let result;

    if (provider === 'zhipu') {
      result = await callZhipuAI(content, model, usedTemperature, systemPrompt);
    } else {
      result = await callOpenAI(content, model, usedTemperature, systemPrompt);
    }

    console.log(`✅ AI Response received`);

    // 4. 返回结果
    return createSuccessResponse({
      reasoning: result.reasoning,
      newStructure: result.newStructure,
      provider,
      model,
      temperature: usedTemperature,
      usedPromptId: promptId ?? (customPrompt ?? 'custom')
    });
  } catch (error: unknown) {
    console.error('❌ AI Error:', error);
    return handleApiError(error);
  }
}

function getDefaultSystemPrompt(): string {
  return `你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID
4. 保持原有内容不变，只调整层级关系
5. **重要：保留所有格式标记！** 斜体用 *text*，粗体用 **text*

原始内容：
{{content}}

请返回重组后的结构，必须严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "reasoning": "重组的理由说明",
  "newStructure": {
    "content": "根节点内容（保留格式标记）",
    "isHeader": false,
    "isSubHeader": false,
    "tags": [],
    "isItalic": false,
    "children": []
  }
}`;
}

/**
 * 调用智谱AI API
 */
async function callZhipuAI(content: string, model: string, temperature: number, systemPrompt: string) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未设置');
  }

  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  const fullPrompt = `${systemPrompt}

原始内容：
${content}

请返回重组后的结构，必须严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "reasoning": "重组的理由说明",
  "newStructure": {
    "content": "根节点内容（保留格式标记）",
    "isHeader": false,
    "isSubHeader": false,
    "tags": [],
    "isItalic": false,
    "children": [
      {
        "content": "子节点内容（保留格式标记）",
        "isHeader": false,
        "isSubHeader": false,
        "tags": [],
        "isItalic": false,
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
          content: fullPrompt,
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
  } catch {
    console.error('❌ JSON Parse Error:', responseContent);
    throw new Error('AI返回的不是有效的JSON格式');
  }
}

/**
 * 调用 OpenAI API (使用 Vercel AI SDK)
 */
async function callOpenAI(content: string, model: string, temperature: number, systemPrompt: string) {
  const { generateObject } = await import('ai');
  const { createAIModel } = await import('@/lib/ai-config');
  const { ReorganizeResultSchema } = await import('@/lib/ai-schema');

  const aiModel = createAIModel('openai', model);

  const result = await generateObject({
    model: aiModel,
    schema: ReorganizeResultSchema,
    system: systemPrompt,
    prompt: `原始内容：
${content}`,
    temperature,
  });

  return result.object;
}

import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import {
  handleApiError,
  parseAndValidateBody,
  createSuccessResponse,
} from '@/lib/api-utils';
import { AIReorganizeRequestSchema } from '@/lib/validation';
import { ReorganizeResultSchema } from '@/lib/ai-schema';
import { createAIModel } from '@/lib/ai-config';

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

    // 2. 创建 AI 模型实例
    const aiModel = createAIModel(provider, model);

    // 3. 构建 AI Prompt
    const prompt = `
你是一个大纲整理助手。请将以下混乱的列表整理成层级清晰的树状结构。

要求：
1. 识别主题，创建父级分类
2. 将相关内容归纳到分类下
3. 只返回 JSON 结构，不要包含 ID
4. 保持原有内容不变，只调整层级关系

原始内容：
${content}

请返回重组后的结构，包含：
- reasoning: 重组的理由说明
- newStructure: 新的树形结构
    `.trim();

    // 4. 调用 AI 生成重组方案
    const result = await generateObject({
      model: aiModel,
      schema: ReorganizeResultSchema,
      prompt,
      temperature,
      mode: 'json', // 强制使用 JSON 模式
    });

    console.log(`✅ AI Response received`);

    // 5. 返回结果
    return createSuccessResponse({
      reasoning: result.object.reasoning,
      newStructure: result.object.newStructure,
      provider,
      model,
      temperature,
    });
  } catch (error: any) {
    console.error('❌ AI Error:', error);
    return handleApiError(error);
  }
}

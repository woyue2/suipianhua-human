'use server'

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { ReorganizeResultSchema } from '@/lib/ai-schema';
import { OutlineNode } from '@/types';

export async function reorganizeOutline(currentTree: OutlineNode) {
  const plainTextTree = extractContentFromTree(currentTree);

  const result = await streamObject({
    model: openai('gpt-4o-mini') as any,
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

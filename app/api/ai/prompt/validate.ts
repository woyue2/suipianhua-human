import { z } from 'zod';

export const promptValidationSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100字符'),
  description: z.string().max(500, '描述不能超过500字符').optional(),
  systemPrompt: z.string().min(10, '系统提示词至少需要10个字符'),
  category: z.enum(['default', 'academic', 'meeting', 'project', 'custom']).default('custom'),
  scenario: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  model: z.string().optional(),
  outputFormat: z.string().optional()
});

export const updatePromptSchema = promptValidationSchema.partial();

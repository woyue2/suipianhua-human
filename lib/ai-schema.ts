import { z } from 'zod';

export const AIOutlineNodeSchema: z.ZodType<{
  content: string;
  isHeader?: boolean;
  isSubHeader?: boolean;
  tags?: string[];
  isItalic?: boolean;
  icon?: string;
  children: any[];
}> = z.object({
  content: z.string(),
  isHeader: z.boolean().optional(),
  isSubHeader: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  isItalic: z.boolean().optional(),
  icon: z.string().optional(),
  children: z.array(z.lazy(() => AIOutlineNodeSchema)),
});

export const ReorganizeResultSchema = z.object({
  reasoning: z.string(),
  newStructure: AIOutlineNodeSchema,
});

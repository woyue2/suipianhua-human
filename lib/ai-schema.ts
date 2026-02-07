import { z } from 'zod';

export const AIOutlineNodeSchema: z.ZodType<{
  content: string;
  children: any[];
}> = z.object({
  content: z.string(),
  children: z.array(z.lazy(() => AIOutlineNodeSchema)),
});

export const ReorganizeResultSchema = z.object({
  reasoning: z.string(),
  newStructure: AIOutlineNodeSchema,
});

import { z } from 'zod';

/**
 * API 请求/响应的通用 Schema
 */

// 通用 API 响应格式
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// 图床上传配置 Schema
export const ImageUploadConfigSchema = z.object({
  provider: z.enum(['imgur', 'smms', 'custom']),
  apiKey: z.string().min(1, 'API Key 不能为空').optional(), // 允许为空，服务端可使用环境变量
  customUrl: z.string().url('自定义 URL 格式不正确').optional(),
});

export type ImageUploadConfig = z.infer<typeof ImageUploadConfigSchema>;

// 文件上传验证 Schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']),
});

// 文档查询参数 Schema
export const DocumentQuerySchema = z.object({
  folderId: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;

// AI 重组请求 Schema
export const AIReorganizeRequestSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  provider: z.enum(['openai', 'zhipu']).default('zhipu'),
  model: z.string().min(1, '模型不能为空'),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type AIReorganizeRequest = z.infer<typeof AIReorganizeRequestSchema>;

// 节点操作参数 Schema
export const NodeOperationSchema = z.object({
  nodeId: z.string().uuid('节点 ID 格式不正确'),
  content: z.string().optional(),
  parentId: z.string().uuid('父节点 ID 格式不正确').optional(),
});

export type NodeOperation = z.infer<typeof NodeOperationSchema>;


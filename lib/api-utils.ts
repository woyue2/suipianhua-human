import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from './validation';

/**
 * API 错误处理工具函数
 */

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 统一的错误处理函数
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]:', error);

  // Zod 验证错误
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json(
      {
        success: false,
        error: firstError.message,
        code: 'VALIDATION_ERROR',
      } as ApiResponse,
      { status: 400 }
    );
  }

  // 自定义 API 错误
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      } as ApiResponse,
      { status: error.statusCode }
    );
  }

  // 标准 Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
      } as ApiResponse,
      { status: 500 }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      success: false,
      error: '服务器内部错误',
      code: 'UNKNOWN_ERROR',
    } as ApiResponse,
    { status: 500 }
  );
}

/**
 * 从请求中解析并验证 JSON Body
 */
export async function parseAndValidateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new ApiError('Invalid JSON body', 400, 'INVALID_JSON');
  }
}

/**
 * 从请求头中解析并验证配置
 */
export function parseAndValidateHeaders<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  headerMapping: Record<string, string>
): T {
  const headers = req.headers;
  const config: Record<string, any> = {};

  for (const [key, headerName] of Object.entries(headerMapping)) {
    const value = headers.get(headerName);
    // 将 null 转换为 undefined，以便 Zod 的 .optional() 能正常工作
    config[key] = value === null ? undefined : value;
  }

  return schema.parse(config);
}

/**
 * 从查询参数中解析并验证
 */
export function parseAndValidateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): T {
  const { searchParams } = new URL(req.url);
  const query: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // 尝试解析数字
    if (!isNaN(Number(value))) {
      query[key] = Number(value);
    } else {
      query[key] = value;
    }
  });

  return schema.parse(query);
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status }
  );
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    } as ApiResponse,
    { status: statusCode }
  );
}

/**
 * 验证文件上传
 */
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024,
  allowedTypes: string[] = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
): void {
  if (!file) {
    throw new ApiError('未选择文件', 400, 'NO_FILE');
  }

  const typeRegex = new RegExp(`^(${allowedTypes.join('|').replace(/\//g, '\\/')})$`);
  if (!typeRegex.test(file.type)) {
    throw new ApiError(
      `不支持的文件类型: ${file.type}`,
      400,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  if (file.size > maxSize) {
    throw new ApiError(
      `文件大小超过限制: ${(maxSize / 1024 / 1024).toFixed(2)} MB`,
      400,
      'FILE_TOO_LARGE'
    );
  }
}


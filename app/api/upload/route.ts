import { NextRequest } from 'next/server';
import {
  handleApiError,
  parseAndValidateHeaders,
  validateFileUpload,
  createSuccessResponse,
  ApiError,
} from '@/lib/api-utils';
import { ImageUploadConfigSchema } from '@/lib/validation';
import { IMAGE_PROVIDERS } from '@/lib/image-upload';

/**
 * POST /api/upload
 * 
 * 图片上传代理接口
 * 支持多个图床提供商（Imgur、SM.MS、自定义）
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 解析并验证请求头配置
    const config = parseAndValidateHeaders(
      req,
      ImageUploadConfigSchema,
      {
        provider: 'x-image-provider',
        apiKey: 'x-image-api-key',
        customUrl: 'x-image-custom-url',
      }
    );

    // 2. 获取上传文件
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('未选择文件', 400, 'NO_FILE');
    }

    // 3. 验证文件
    validateFileUpload(file);

    // 4. 获取图床提供商信息
    const providerInfo = IMAGE_PROVIDERS[config.provider];
    if (!providerInfo) {
      throw new ApiError('不支持的图床提供商', 400, 'INVALID_PROVIDER');
    }

    const uploadUrl =
      typeof providerInfo.uploadUrl === 'function'
        ? providerInfo.uploadUrl(config)
        : providerInfo.uploadUrl;

    // 5. 构建上传请求
    const upstreamFormData = new FormData();
    upstreamFormData.append(providerInfo.formFieldName, file);

    // 6. 上传到图床
    const upstreamRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: providerInfo.headers(config),
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      throw new ApiError(
        `图床返回错误：${upstreamRes.status}`,
        upstreamRes.status,
        'UPSTREAM_ERROR'
      );
    }

    // 7. 解析响应
    const upstreamData = await upstreamRes.json();
    const parsed = providerInfo.parseResponse(upstreamData);

    if (!parsed?.url) {
      throw new ApiError(
        '图床返回数据格式不符合预期',
        502,
        'PARSE_ERROR'
      );
    }

    // 8. 返回成功响应
    return createSuccessResponse({ url: parsed.url });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from 'next/server';
import {
  handleApiError,
  validateFileUpload,
  createSuccessResponse,
  ApiError,
} from '@/lib/api-utils';
import { ImageUploadConfigSchema } from '@/lib/validation';
import { IMAGE_PROVIDERS } from '@/lib/image-upload';

export const runtime = 'nodejs';

/**
 * POST /api/upload
 * 
 * 图片上传代理接口
 * 支持多个图床提供商（Imgur、SM.MS、自定义）
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 解析请求头配置（允许使用环境变量作为后备）
    const provider = req.headers.get('x-image-provider') || 'imgur';
    let apiKey = req.headers.get('x-image-api-key');
    const customUrl = req.headers.get('x-image-custom-url') || undefined;

    // 如果前端没有提供 API Key，使用环境变量作为后备
    if (!apiKey) {
      if (provider === 'imgur') {
        apiKey = process.env.IMGUR_API_KEY || '';
      } else if (provider === 'smms') {
        apiKey = process.env.SM_MS_API_KEY || '';
      }
    }

    const config = {
      provider: provider as 'imgur' | 'smms' | 'custom',
      apiKey: apiKey || undefined,
      customUrl,
    };

    // 验证配置
    const validatedConfig = ImageUploadConfigSchema.parse(config);
    if (validatedConfig.customUrl) {
      const parsedUrl = new URL(validatedConfig.customUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new ApiError('自定义图床仅支持 http/https 协议', 400, 'INVALID_CUSTOM_PROTOCOL');
      }
    }

    // 2. 获取上传文件
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('未选择文件', 400, 'NO_FILE');
    }

    // 3. 验证文件
    validateFileUpload(file);

    if (validatedConfig.provider === 'custom' && !validatedConfig.customUrl) {
      throw new ApiError('自定义图床未填写上传地址', 400, 'CUSTOM_URL_REQUIRED');
    }
    if (
      (validatedConfig.provider === 'imgur' || validatedConfig.provider === 'smms') &&
      !validatedConfig.apiKey
    ) {
      throw new ApiError('图床 API Key 未配置', 400, 'API_KEY_REQUIRED');
    }

    // 4. 获取图床提供商信息
    const providerInfo = IMAGE_PROVIDERS[config.provider];
    if (!providerInfo) {
      throw new ApiError('不支持的图床提供商', 400, 'INVALID_PROVIDER');
    }

    const uploadUrl =
      typeof providerInfo.uploadUrl === 'function'
        ? providerInfo.uploadUrl(validatedConfig)
        : providerInfo.uploadUrl;

    // 5. 构建上传请求
    const upstreamFormData = new FormData();
    upstreamFormData.append(providerInfo.formFieldName, file);

    // 6. 上传到图床
    const upstreamRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: providerInfo.headers(validatedConfig),
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      const upstreamText = await upstreamRes.text();
      throw new ApiError(
        `图床返回错误：${upstreamRes.status} ${upstreamText}`,
        upstreamRes.status,
        'UPSTREAM_ERROR'
      );
    }

    // 7. 解析响应
    const upstreamData = await upstreamRes.json();
    const parsed = providerInfo.parseResponse(upstreamData);

    if (!parsed?.url) {
      const payload =
        typeof upstreamData === 'string' ? upstreamData : JSON.stringify(upstreamData);
      throw new ApiError(
        `图床返回数据格式不符合预期：${payload}`,
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

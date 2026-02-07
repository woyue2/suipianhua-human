import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_PROVIDERS } from '@/lib/image-upload';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(png|jpeg|jpg|gif|webp)$/;

function validateFile(file: File) {
  if (!ALLOWED_TYPES.test(file.type)) {
    throw new Error('Unsupported image type');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5 MB limit');
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: '未选择文件' } },
        { status: 400 }
      );
    }

    validateFile(file);

    const provider = (req.headers.get('x-image-provider') || 'imgur') as 'imgur' | 'smms' | 'custom';
    const apiKey = req.headers.get('x-image-api-key') || '';
    const customUrl = req.headers.get('x-image-custom-url') || undefined;

    const providerInfo = IMAGE_PROVIDERS[provider];
    const uploadUrl = typeof providerInfo.uploadUrl === 'function'
      ? providerInfo.uploadUrl({ provider, apiKey, customUrl })
      : providerInfo.uploadUrl;

    const upstreamFormData = new FormData();
    upstreamFormData.append(providerInfo.formFieldName, file);

    const upstreamRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: providerInfo.headers({ provider, apiKey, customUrl }),
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'UPSTREAM_ERROR', message: `图床返回错误：${upstreamRes.status}` } },
        { status: upstreamRes.status }
      );
    }

    const upstreamData = await upstreamRes.json();
    const parsed = providerInfo.parseResponse(upstreamData);

    if (!parsed?.url) {
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: '图床返回数据格式不符合预期' } },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, url: parsed.url });
  } catch (err: any) {
    console.error('[upload] error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message || '服务器内部错误' } },
      { status: 500 }
    );
  }
}

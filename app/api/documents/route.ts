import { NextRequest } from 'next/server';
import {
  handleApiError,
  parseAndValidateQuery,
  createSuccessResponse,
} from '@/lib/api-utils';
import { DocumentQuerySchema } from '@/lib/validation';
import { supabaseDocumentDb } from '@/lib/supabase-db';

/**
 * GET /api/documents
 *
 * 返回文档列表（支持查询参数）
 *
 * 查询参数：
 * - folderId: 文件夹 ID（可选，MVP 阶段不支持）
 * - sortBy: 排序字段（updatedAt | createdAt | title）
 * - order: 排序顺序（asc | desc）
 * - limit: 每页数量（默认 50，最大 100）
 * - offset: 偏移量（默认 0）
 *
 * MVP 限制：
 * 由于使用 IndexedDB（客户端存储），此接口返回空数组作为占位符。
 * 实际文档列表应在客户端通过 documentDb.listDocuments() 获取。
 *
 * 生产环境建议：
 * - 使用真实数据库（PostgreSQL、MongoDB 等）
 * - 实现用户认证和授权
 * - 服务端存储文档数据
 */
export async function GET(req: NextRequest) {
  try {
    // 解析并验证查询参数
    const query = parseAndValidateQuery(req, DocumentQuerySchema);

    // 如果配置了 Supabase，则从服务端返回文档列表
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const documents = await supabaseDocumentDb.listDocuments();
        return createSuccessResponse({
          documents,
          total: documents.length,
          query,
          message: '来自 Supabase 的文档列表',
        });
      } catch (e: unknown) {
        // Supabase 查询失败时，返回占位信息并提示原因
        return createSuccessResponse({
          documents: [],
          total: 0,
          query,
          message: `Supabase 查询失败: ${e instanceof Error ? e.message : '未知错误'}`,
        });
      }
    }

    // 未配置 Supabase：返回占位信息，提示使用客户端 IndexedDB
    return createSuccessResponse({
      documents: [],
      total: 0,
      query,
      message: 'MVP 阶段请使用客户端 IndexedDB 查询',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/documents
 *
 * 创建新文档（预留接口）
 *
 * MVP 阶段不实现，文档创建在客户端完成
 */
export async function POST() {
  try {
    return createSuccessResponse(
      {
        message: 'MVP 阶段文档创建在客户端完成',
      },
      501 // Not Implemented
    );
  } catch (error) {
    return handleApiError(error);
  }
}

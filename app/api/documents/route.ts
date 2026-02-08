import { NextRequest } from 'next/server';
import {
  handleApiError,
  parseAndValidateQuery,
  createSuccessResponse,
} from '@/lib/api-utils';
import { DocumentQuerySchema } from '@/lib/validation';

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

    // MVP: 返回空数组（IndexedDB 仅在浏览器端可用）
    // 客户端应直接使用 documentDb.listDocuments()
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
export async function POST(req: NextRequest) {
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

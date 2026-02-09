import { supabase } from '@/lib/supabase'
import type { Document } from '@/types'

// 回收站配置
const TRASH_CONFIG = {
  MAX_TRASH_SIZE: 50,        // 最多保存50个已删除文档
  AUTO_DELETE_DAYS: 30,      // 30天后自动永久删除
  CLEANUP_KEY: 'lastTrashCleanup', // 上次清理时间
};

export const supabaseDocumentDb = {
  async saveDocument(document: Document, userId?: string): Promise<void> {
    // 如果文档被移到回收站，检查容量限制
    if (document.metadata.deletedAt) {
      await this.enforceTrashLimit(userId)
    }

    const now = new Date().toISOString()
    const payload = {
      id: document.id,
      title: document.title,
      root: document.root,
      metadata: {
        ...document.metadata,
        icon: document.root.icon,
      },
      created_at: new Date(document.metadata.createdAt).toISOString(),
      updated_at: now,
      user_id: userId ?? null,
    }

    const { error } = await supabase
      .from('documents')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error
  },

  async loadDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('id,title,root,metadata,updated_at,created_at')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    const doc: Document = {
      id: data.id,
      title: data.title,
      root: data.root,
      metadata: {
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        version: data.metadata?.version ?? '1.0.0',
        deletedAt: data.metadata?.deletedAt ?? null,
      },
    }
    return doc
  },

  async listDocuments(userId?: string) {
    // 自动执行定期清理（每天一次）
    await this.periodicCleanup(userId)

    let query = supabase
      .from('documents')
      .select('id,title,updated_at,metadata')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(d => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updated_at,
      deletedAt: d.metadata?.deletedAt ?? null,
      icon: d.metadata?.icon,
    }))
  },

  async deleteDocument(id: string, userId?: string) {
    let query = supabase
      .from('documents')
      .delete()
      .eq('id', id)
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { error } = await query
    if (error) throw error
  },

  async deleteDocuments(ids: string[], userId?: string) {
    if (ids.length === 0) return
    let query = supabase
      .from('documents')
      .delete()
      .in('id', ids)
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { error } = await query
    if (error) throw error
  },

  /**
   * 获取回收站中的文档列表（按删除时间倒序）
   */
  async listTrashedDocuments(userId?: string): Promise<Array<{ id: string; title: string; deletedAt: number }>> {
    let query = supabase
      .from('documents')
      .select('id,title,metadata')
      .not('metadata->>deletedAt', 'is', null)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? [])
      .map(d => ({
        id: d.id,
        title: d.title,
        deletedAt: d.metadata?.deletedAt || 0,
      }))
      .sort((a, b) => b.deletedAt - a.deletedAt)
  },

  /**
   * 清理超过指定天数的回收站文档（自动清理）
   */
  async cleanupOldTrash(userId?: string): Promise<number> {
    try {
      const now = Date.now()
      const threshold = now - (TRASH_CONFIG.AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000)
      const thresholdDate = new Date(threshold).toISOString()

      // 查询需要删除的文档
      let query = supabase
        .from('documents')
        .select('id')
        .lt('metadata->>deletedAt', thresholdDate.toString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: toDelete, error: queryError } = await query
      if (queryError) throw queryError

      if (toDelete && toDelete.length > 0) {
        const ids = toDelete.map(d => d.id)
        let deleteQuery = supabase
          .from('documents')
          .delete()
          .in('id', ids)

        if (userId) {
          deleteQuery = deleteQuery.eq('user_id', userId)
        }

        const { error: deleteError } = await deleteQuery
        if (deleteError) throw deleteError

        console.log(`🗑️ Auto-cleaned ${toDelete.length} trashed documents (older than ${TRASH_CONFIG.AUTO_DELETE_DAYS} days)`)
        return toDelete.length
      }

      return 0
    } catch (error) {
      console.error('Failed to cleanup old trash:', error)
      return 0
    }
  },

  /**
   * 强制执行回收站容量限制（删除最旧的文档）
   */
  async enforceTrashLimit(userId?: string): Promise<number> {
    try {
      const trashedDocs = await this.listTrashedDocuments(userId)

      if (trashedDocs.length > TRASH_CONFIG.MAX_TRASH_SIZE) {
        const toDelete = trashedDocs.slice(TRASH_CONFIG.MAX_TRASH_SIZE)
        const ids = toDelete.map(d => d.id)

        let deleteQuery = supabase
          .from('documents')
          .delete()
          .in('id', ids)

        if (userId) {
          deleteQuery = deleteQuery.eq('user_id', userId)
        }

        const { error } = await deleteQuery
        if (error) throw error

        console.log(`📦 Enforced trash limit: removed ${toDelete.length} oldest documents (limit: ${TRASH_CONFIG.MAX_TRASH_SIZE})`)
        return toDelete.length
      }

      return 0
    } catch (error) {
      console.error('Failed to enforce trash limit:', error)
      return 0
    }
  },

  /**
   * 定期清理检查（在合适时机调用）
   */
  async periodicCleanup(userId?: string): Promise<void> {
    const lastCleanup = localStorage.getItem(TRASH_CONFIG.CLEANUP_KEY)
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // 每天执行一次清理
    if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_DAY) {
      await this.cleanupOldTrash(userId)
      localStorage.setItem(TRASH_CONFIG.CLEANUP_KEY, now.toString())
    }
  },
}

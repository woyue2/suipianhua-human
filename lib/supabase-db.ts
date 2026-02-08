import { supabase } from '@/lib/supabase'
import type { Document } from '@/types'

export const supabaseDocumentDb = {
  async saveDocument(document: Document, userId?: string): Promise<void> {
    const now = new Date().toISOString()
    const payload = {
      id: document.id,
      title: document.title,
      root: document.root,
      metadata: document.metadata,
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
      },
    }
    return doc
  },

  async listDocuments(userId?: string) {
    let query = supabase
      .from('documents')
      .select('id,title,updated_at')
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
}

import Dexie, { Table } from 'dexie';
import { Document, StoredOutlineNode, OutlineNode } from '@/types';

// 定义 IndexedDB 表结构
interface DocumentRecord {
  id: string;
  title: string;
  root: OutlineNode;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
  createdAt: number;
  updatedAt: number;
}

// 创建 Dexie 数据库类
export class OutlineDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>;

  constructor() {
    super('OutlineEditorDB');

    // 定义数据库版本和表结构
    this.version(1).stores({
      documents: 'id, title, createdAt, updatedAt', // 索引字段
    });
  }
}

// 创建数据库实例
export const db = new OutlineDatabase();

// 文档操作封装
export const documentDb = {
  /**
   * 保存文档到 IndexedDB
   */
  async saveDocument(document: Document): Promise<void> {
    try {
      const now = Date.now();
      const record: DocumentRecord = {
        ...document,
        createdAt: document.metadata.createdAt,
        updatedAt: now,
      };

      await db.documents.put(record);
      console.log('Document saved successfully:', document.id);
    } catch (error) {
      console.error('Failed to save document to IndexedDB:', error);
      throw error;
    }
  },

  /**
   * 从 IndexedDB 加载文档
   */
  async loadDocument(documentId: string): Promise<Document | null> {
    try {
      const record = await db.documents.get(documentId);

      if (!record) {
        console.warn('Document not found:', documentId);
        return null;
      }

      return {
        id: record.id,
        title: record.title,
        root: record.root,
        metadata: {
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          version: record.metadata.version,
        },
      };
    } catch (error) {
      console.error('Failed to load document from IndexedDB:', error);
      throw error;
    }
  },

  /**
   * 获取所有文档列表
   * Returns array of { id, title, updatedAt } sorted by updatedAt descending
   */
  async listDocuments(): Promise<Array<{ id: string; title: string; updatedAt: number }>> {
    try {
      const docs = await db.documents.toArray();
      return docs
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          updatedAt: doc.updatedAt,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to list documents:', error);
      throw error;
    }
  },

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await db.documents.delete(documentId);
      console.log('Document deleted:', documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },

  /**
   * 清空所有文档
   */
  async clearAllDocuments(): Promise<void> {
    try {
      await db.documents.clear();
      console.log('All documents cleared');
    } catch (error) {
      console.error('Failed to clear documents:', error);
      throw error;
    }
  },
};

// 导出数据库实例（用于直接访问）
export default db;

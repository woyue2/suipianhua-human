import Dexie, { Table } from 'dexie';
import { Document, OutlineNode } from '@/types';

// 定义 IndexedDB 表结构
interface DocumentRecord {
  id: string;
  title: string;
  root: OutlineNode;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    deletedAt?: number | null;
    icon?: string;
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
    
    // 预留 V2 迁移示例
    // this.version(2).stores({
    //   documents: 'id, title, createdAt, updatedAt, tags'
    // }).upgrade(tx => {
    //   // return tx.table('documents').toCollection().modify(doc => {
    //   //   doc.tags = [];
    //   // });
    // });
  }
}

// 文档数据迁移逻辑
const DOCUMENT_VERSION = '1.0.0';

const migrations: Record<string, (doc: Document) => Document> = {
  // 示例：将 0.9.0 迁移到 1.0.0
  // '0.9.0': (doc) => {
  //   doc.metadata.version = '1.0.0';
  //   return doc;
  // },
};

// 版本比较辅助函数
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function migrateDocument(doc: Document): Document {
  let currentDoc: Document = {
    id: doc.id,
    title: doc.title || '未命名',
    root: doc.root,
    metadata: {
      createdAt: doc.metadata.createdAt ?? Date.now(),
      updatedAt: doc.metadata.updatedAt ?? Date.now(),
      version: doc.metadata.version ?? '0.0.0',
      deletedAt: doc.metadata.deletedAt ?? null,
    },
  };

  const currentVersion = currentDoc.metadata.version;
  
  // 如果当前版本低于目标版本
  if (compareVersions(currentVersion, DOCUMENT_VERSION) < 0) {
    console.log(`Migrating document ${doc.id} from ${currentVersion} to ${DOCUMENT_VERSION}`);
    
    // 获取所有迁移版本并排序
    const migrationVersions = Object.keys(migrations).sort(compareVersions);
    
    // 按顺序应用迁移
    for (const version of migrationVersions) {
      if (compareVersions(version, currentVersion) > 0 && 
          compareVersions(version, DOCUMENT_VERSION) <= 0) {
        try {
          console.log(`Applying migration to version ${version}`);
          currentDoc = migrations[version](currentDoc);
          currentDoc.metadata.version = version;
        } catch (error) {
          console.error(`Migration to version ${version} failed for document ${currentDoc.id}:`, error);
          // 可以在这里决定是中断还是继续，通常应该中断并报错
          throw error;
        }
      }
    }
    
    // 如果没有特定迁移需要应用（仅版本号更新），或者迁移后版本未更新到最新
    if (currentDoc.metadata.version !== DOCUMENT_VERSION) {
       currentDoc.metadata.version = DOCUMENT_VERSION;
    }
  }

  return currentDoc;
}

// 回收站配置
const TRASH_CONFIG = {
  MAX_TRASH_SIZE: 50,        // 最多保存50个已删除文档
  AUTO_DELETE_DAYS: 30,      // 30天后自动永久删除
  CLEANUP_KEY: 'lastTrashCleanup', // 上次清理时间
};

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

      // 如果文档被移到回收站，检查容量限制
      if (document.metadata.deletedAt) {
        await this.enforceTrashLimit();
      }

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

      const doc = {
        id: record.id,
        title: record.title,
        root: record.root,
        metadata: {
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          version: record.metadata.version,
          deletedAt: record.metadata.deletedAt ?? null,
        },
      };

      return migrateDocument(doc);
    } catch (error) {
      console.error('Failed to load document from IndexedDB:', error);
      throw error;
    }
  },

  /**
   * 获取所有文档列表
   * Returns array of { id, title, updatedAt } sorted by updatedAt descending
   */
  async listDocuments(): Promise<Array<{ id: string; title: string; updatedAt: number; deletedAt?: number | null; icon?: string }>> {
    try {
      // 自动执行定期清理（每天一次）
      await this.periodicCleanup();

      const docs = await db.documents.toArray();
      return docs
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          updatedAt: doc.updatedAt,
          deletedAt: doc.metadata.deletedAt ?? null,
          icon: doc.root.icon || doc.metadata.icon,
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

  /**
   * 获取回收站中的文档列表（按删除时间倒序）
   */
  async listTrashedDocuments(): Promise<Array<{ id: string; title: string; deletedAt: number }>> {
    try {
      const docs = await db.documents.toArray();
      return docs
        .filter(doc => doc.metadata.deletedAt)
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          deletedAt: doc.metadata.deletedAt!,
        }))
        .sort((a, b) => b.deletedAt - a.deletedAt);
    } catch (error) {
      console.error('Failed to list trashed documents:', error);
      throw error;
    }
  },

  /**
   * 清理超过指定天数的回收站文档（自动清理）
   */
  async cleanupOldTrash(): Promise<number> {
    try {
      const now = Date.now();
      const threshold = now - (TRASH_CONFIG.AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);
      const trashedDocs = await this.listTrashedDocuments();
      const toDelete = trashedDocs.filter(doc => doc.deletedAt < threshold);

      if (toDelete.length > 0) {
        const ids = toDelete.map(d => d.id);
        for (const id of ids) {
          await db.documents.delete(id);
        }
        console.log(`🗑️ Auto-cleaned ${toDelete.length} trashed documents (older than ${TRASH_CONFIG.AUTO_DELETE_DAYS} days)`);
      }

      return toDelete.length;
    } catch (error) {
      console.error('Failed to cleanup old trash:', error);
      return 0;
    }
  },

  /**
   * 强制执行回收站容量限制（删除最旧的文档）
   */
  async enforceTrashLimit(): Promise<number> {
    try {
      const trashedDocs = await this.listTrashedDocuments();

      if (trashedDocs.length > TRASH_CONFIG.MAX_TRASH_SIZE) {
        const toDelete = trashedDocs.slice(TRASH_CONFIG.MAX_TRASH_SIZE);
        for (const doc of toDelete) {
          await db.documents.delete(doc.id);
        }
        console.log(`📦 Enforced trash limit: removed ${toDelete.length} oldest documents (limit: ${TRASH_CONFIG.MAX_TRASH_SIZE})`);
        return toDelete.length;
      }

      return 0;
    } catch (error) {
      console.error('Failed to enforce trash limit:', error);
      return 0;
    }
  },

  /**
   * 定期清理检查（在合适时机调用）
   */
  async periodicCleanup(): Promise<void> {
    const lastCleanup = localStorage.getItem(TRASH_CONFIG.CLEANUP_KEY);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // 每天执行一次清理
    if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_DAY) {
      await this.cleanupOldTrash();
      localStorage.setItem(TRASH_CONFIG.CLEANUP_KEY, now.toString());
    }
  },
};

// 导出数据库实例（用于直接访问）
export default db;

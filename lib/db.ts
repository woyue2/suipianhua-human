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

const migrations: Record<string, (doc: any) => any> = {
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

function migrateDocument(doc: any): Document {
  if (!doc.metadata || !doc.metadata.version) {
    doc.metadata = { ...doc.metadata, version: '0.0.0' };
  }

  const currentVersion = doc.metadata.version;
  
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
          doc = migrations[version](doc);
          doc.metadata.version = version;
        } catch (error) {
          console.error(`Migration to version ${version} failed for document ${doc.id}:`, error);
          // 可以在这里决定是中断还是继续，通常应该中断并报错
          throw error;
        }
      }
    }
    
    // 如果没有特定迁移需要应用（仅版本号更新），或者迁移后版本未更新到最新
    if (doc.metadata.version !== DOCUMENT_VERSION) {
       doc.metadata.version = DOCUMENT_VERSION;
    }
  }

  return doc as Document;
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

      const doc = {
        id: record.id,
        title: record.title,
        root: record.root,
        metadata: {
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          version: record.metadata.version,
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

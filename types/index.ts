// === 核心业务实体 ===

// 定义扁平化的节点（用于 Store 存储层）
export interface StoredOutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: string[]; // 存储 ID 数组
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
  // UI 相关属性
  isHeader?: boolean;
  isSubHeader?: boolean;
  tags?: string[];
  isItalic?: boolean;
  icon?: string;
}

// 定义树形节点（用于 UI 渲染和导出）
export interface OutlineNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  children: OutlineNode[]; // 渲染时使用对象数组
  images: ImageAttachment[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
  // UI 相关属性
  isHeader?: boolean;
  isSubHeader?: boolean;
  tags?: string[];
  isItalic?: boolean;
  icon?: string;
}

export interface ImageAttachment {
  id: string;
  url: string;
  thumbnail?: string;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
  uploadedAt: number;
}

export interface Document {
  id: string;
  title: string;
  root: OutlineNode;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

// === Sidebar 相关 ===
export interface SidebarItem {
  id: string;
  title: string;
  icon?: string;
  emoji?: string;
  children?: SidebarItem[];
  isOpen?: boolean;
  isActive?: boolean;
}

// === AI 功能实体 ===
export interface ReorganizePlan {
  originalStructure: OutlineNode;
  proposedStructure: OutlineNode;
  changes: ReorganizeChange[];
  reasoning: string;
}

export interface ReorganizeChange {
  type: 'move' | 'rename' | 'merge' | 'split' | 'create_category';
  description: string;
  fromPath: string[];
  toPath: string[];
}

// === 配置实体 ===
export interface UserConfig {
  aiProvider: 'claude' | 'openai' | 'gemini';
  apiKeys: {
    claude?: string;
    openai?: string;
    gemini?: string;
  };
  imageUpload: {
    provider: 'imgur' | 'smms' | 'custom';
    customUrl?: string;
    apiKey?: string;
  };
}


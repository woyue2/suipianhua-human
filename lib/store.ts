'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StoredOutlineNode, OutlineNode, Document } from '@/types';
import { LineSpacingType, DEFAULTS } from '@/lib/constants';
import { documentDb } from '@/lib/db';
import { supabaseDocumentDb } from '@/lib/supabase-db';
import { getCurrentUserId } from '@/lib/auth-context';

interface HistoryState {
  nodes: Record<string, StoredOutlineNode>;
  rootId: string;
  title: string;
}

interface EditorStore {
  // 扁平化存储：所有节点平铺在字典中
  nodes: Record<string, StoredOutlineNode>;
  rootId: string;
  documentId: string;
  title: string;

  // UI 状态
  showAIModal: boolean;
  showSettings: boolean;
  isDarkMode: boolean;
  lineSpacing: LineSpacingType;
  focusedNodeId: string | null;
  filterTag: string | null;

  // 自动保存状态
  autoSaveEnabled: boolean;
  lastSavedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // 历史栈
  history: {
    past: HistoryState[];
    present: HistoryState | null;
    future: HistoryState[];
  };

  // Document list
  documents: Array<{ id: string; title: string; updatedAt: number }>;
  isLoadingDocuments: boolean;

  // 全局工具栏状态（确保同一时间只有一个工具栏显示）
  activeToolbarNodeId: string | null;
  activeFormatToolbarNodeId: string | null;
  setActiveToolbarNodeId: (nodeId: string | null) => void;
  setActiveFormatToolbarNodeId: (nodeId: string | null) => void;

  // Actions - 基础操作
  updateNodeContent: (id: string, content: string) => void;
  toggleCollapse: (id: string) => void;
  addImage: (nodeId: string, image: any) => void;
  removeImage: (nodeId: string, imageId: string) => void;
  
  // 节点操作 Actions
  addChildNode: (parentId: string) => string;
  addSiblingNode: (nodeId: string) => string;
  deleteNode: (nodeId: string) => void;
  indentNode: (nodeId: string) => void;
  outdentNode: (nodeId: string) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
  
  // Drag & Drop
  moveNode: (activeId: string, overId: string, type: 'before' | 'after' | 'inside') => void;

  // UI Actions
  setShowAIModal: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setFocusedNodeId: (id: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  removeTag: (nodeId: string, tag: string) => void;
  toggleDarkMode: () => void;
  setLineSpacing: (spacing: LineSpacingType) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;

  // 辅助方法
  buildDocumentTree: () => Document;
  loadDocument: (document: Document) => void;
  saveDocument: () => Promise<void>;
  fetchDocuments: () => Promise<Array<{ id: string; title: string; updatedAt: number }>>;

  // 初始化
  initializeWithData: (nodes: Record<string, StoredOutlineNode>, rootId: string, title: string) => void;

  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // 辅助
  canUndo: boolean;
  canRedo: boolean;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    nodes: {},
    rootId: '',
    documentId: '',
    title: '',
    showAIModal: false,
    showSettings: false,
    isDarkMode: false,
    lineSpacing: DEFAULTS.LINE_SPACING,
    focusedNodeId: null,
    filterTag: null,
    autoSaveEnabled: true,
    lastSavedAt: null,
    saveStatus: 'idle',
    history: {
      past: [],
      present: null,
      future: [],
    },
    canUndo: false,
    canRedo: false,
    documents: [],
    isLoadingDocuments: false,
    activeToolbarNodeId: null,
    activeFormatToolbarNodeId: null,

    updateNodeContent: (id, content) => {
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].content = content;
          state.nodes[id].updatedAt = Date.now();
        }
      });
      
      // ✅ 内容更新后自动保存历史（用于撤销/重做）
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    toggleCollapse: (id) => {
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].collapsed = !state.nodes[id].collapsed;
        }
      });
    },

    addImage: (nodeId, image) => {
      set(state => {
        if (state.nodes[nodeId]) {
          // immer 会自动处理不可变性
          state.nodes[nodeId].images.push(image);
          state.nodes[nodeId].updatedAt = Date.now();
        }
      });
    },

    removeImage: (nodeId, imageId) => {
      set(state => {
        if (state.nodes[nodeId]) {
          state.nodes[nodeId].images = state.nodes[nodeId].images.filter(
            img => img.id !== imageId
          );
          state.nodes[nodeId].updatedAt = Date.now();
        }
      });
    },

    // 添加子节点
    addChildNode: (parentId) => {
      const newId = crypto.randomUUID();
      const now = Date.now();
      
      set(state => {
        const parent = state.nodes[parentId];
        if (!parent) return;

        // 创建新节点
        state.nodes[newId] = {
          id: newId,
          parentId: parentId,
          content: '',
          level: parent.level + 1,
          children: [],
          images: [],
          collapsed: false,
          createdAt: now,
          updatedAt: now,
        };

        // 添加到父节点的 children
        parent.children.push(newId);
        parent.updatedAt = now;
      });

      console.log('➕ Added child node:', newId);
      return newId;
    },

    // 添加兄弟节点
    addSiblingNode: (nodeId) => {
      const newId = crypto.randomUUID();
      const now = Date.now();
      
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        // 创建新节点
        state.nodes[newId] = {
          id: newId,
          parentId: node.parentId,
          content: '',
          level: node.level,
          children: [],
          images: [],
          collapsed: false,
          createdAt: now,
          updatedAt: now,
        };

        // 插入到当前节点后面
        const index = parent.children.indexOf(nodeId);
        parent.children.splice(index + 1, 0, newId);
        parent.updatedAt = now;
      });

      console.log('➕ Added sibling node:', newId);
      set({ focusedNodeId: newId });
      return newId;
    },

    // 删除节点
    deleteNode: (nodeId) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) {
          console.log('⚠️ Cannot delete root node');
          return;
        }

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        // 递归删除所有子节点
        const deleteRecursive = (id: string) => {
          const n = state.nodes[id];
          if (!n) return;
          
          n.children.forEach(childId => deleteRecursive(childId));
          delete state.nodes[id];
        };

        deleteRecursive(nodeId);

        // 从父节点移除
        parent.children = parent.children.filter(id => id !== nodeId);
        parent.updatedAt = Date.now();
      });

      console.log('🗑️ Deleted node:', nodeId);
    },

    // 增加缩进（变成上一个兄弟节点的子节点）
    indentNode: (nodeId) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        const index = parent.children.indexOf(nodeId);
        if (index <= 0) {
          console.log('⚠️ Cannot indent: no previous sibling');
          return;
        }

        // 获取上一个兄弟节点
        const prevSiblingId = parent.children[index - 1];
        const prevSibling = state.nodes[prevSiblingId];
        if (!prevSibling) return;

        // 从原父节点移除
        parent.children.splice(index, 1);

        // 添加到上一个兄弟节点的子节点
        prevSibling.children.push(nodeId);
        node.parentId = prevSiblingId;
        node.level = prevSibling.level + 1;

        // 递归更新所有子节点的 level
        const updateLevel = (id: string, newLevel: number) => {
          const n = state.nodes[id];
          if (!n) return;
          n.level = newLevel;
          n.children.forEach(childId => updateLevel(childId, newLevel + 1));
        };
        updateLevel(nodeId, prevSibling.level + 1);

        parent.updatedAt = Date.now();
        prevSibling.updatedAt = Date.now();
      });

      console.log('→ Indented node:', nodeId);
    },

    // 减少缩进（变成父节点的兄弟节点）
    outdentNode: (nodeId) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent || !parent.parentId) {
          console.log('⚠️ Cannot outdent: already at top level');
          return;
        }

        const grandParent = state.nodes[parent.parentId];
        if (!grandParent) return;

        // 从原父节点移除
        parent.children = parent.children.filter(id => id !== nodeId);

        // 添加到祖父节点
        const parentIndex = grandParent.children.indexOf(parent.id);
        grandParent.children.splice(parentIndex + 1, 0, nodeId);
        
        node.parentId = parent.parentId;
        node.level = parent.level;

        // 递归更新所有子节点的 level
        const updateLevel = (id: string, newLevel: number) => {
          const n = state.nodes[id];
          if (!n) return;
          n.level = newLevel;
          n.children.forEach(childId => updateLevel(childId, newLevel + 1));
        };
        updateLevel(nodeId, parent.level);

        parent.updatedAt = Date.now();
        grandParent.updatedAt = Date.now();
      });

      console.log('← Outdented node:', nodeId);
    },

    // 上移节点
    moveNodeUp: (nodeId) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        const index = parent.children.indexOf(nodeId);
        if (index <= 0) {
          console.log('⚠️ Cannot move up: already at top');
          return;
        }

        // 交换位置
        [parent.children[index - 1], parent.children[index]] = 
        [parent.children[index], parent.children[index - 1]];

        parent.updatedAt = Date.now();
      });

      console.log('↑ Moved node up:', nodeId);
    },

    // 下移节点
    moveNodeDown: (nodeId) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (!node || !node.parentId) return;

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        const index = parent.children.indexOf(nodeId);
        if (index >= parent.children.length - 1) {
          console.log('⚠️ Cannot move down: already at bottom');
          return;
        }

        // 交换位置
        [parent.children[index], parent.children[index + 1]] = 
        [parent.children[index + 1], parent.children[index]];

        parent.updatedAt = Date.now();
      });

      console.log('↓ Moved node down:', nodeId);
    },

    setShowAIModal: (show) => {
      set({ showAIModal: show });
    },

    setShowSettings: (show) => {
      set({ showSettings: show });
    },

    setFocusedNodeId: (id) => {
      set({ focusedNodeId: id });
    },

    setFilterTag: (tag) => {
      set({ filterTag: tag });
    },

    removeTag: (nodeId, tag) => {
      set(state => {
        const node = state.nodes[nodeId];
        if (node && node.tags) {
          node.tags = node.tags.filter(t => t !== tag);
          node.updatedAt = Date.now();
        }
      });
    },

    toggleDarkMode: () => {
      set(state => {
        state.isDarkMode = !state.isDarkMode;
      });
    },

    setLineSpacing: (spacing) => {
      set({ lineSpacing: spacing });
      console.log('📏 Line spacing changed to:', spacing);
    },

    setAutoSaveEnabled: (enabled) => {
      set({ autoSaveEnabled: enabled });
      console.log('💾 Auto save enabled changed to:', enabled);
    },

    setActiveToolbarNodeId: (nodeId) => {
      set({ activeToolbarNodeId: nodeId });
    },

    setActiveFormatToolbarNodeId: (nodeId) => {
      set({ activeFormatToolbarNodeId: nodeId });
    },

    buildDocumentTree: (): Document => {
      const state = get();
      const nodesMap = state.nodes;
      const rootNode = nodesMap[state.rootId];

      if (!rootNode) {
        throw new Error('Root node not found');
      }

      const buildNode = (nodeId: string): OutlineNode => {
        const storedNode = nodesMap[nodeId];
        return {
          ...storedNode,
          children: storedNode.children.map(buildNode),
        } as OutlineNode;
      };

      return {
        id: state.documentId,
        title: state.title,
        root: buildNode(state.rootId),
        metadata: {
          createdAt: rootNode.createdAt,
          updatedAt: rootNode.updatedAt,
          version: '1.0.0',
        },
      };
    },

    saveDocument: async () => {
      const state = get();

      try {
        set({ saveStatus: 'saving' });

        const document = state.buildDocumentTree();

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const userId = getCurrentUserId();
        if (url && key && userId) {
          await supabaseDocumentDb.saveDocument(document, userId);
        } else {
          await documentDb.saveDocument(document);
        }

        set({
          saveStatus: 'saved',
          lastSavedAt: Date.now(),
        });

        console.log('✅ Document saved successfully:', document.id);

        // 2秒后重置状态
        setTimeout(() => {
          if (get().saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 2000);
      } catch (error) {
        console.error('❌ Failed to save document:', error);
        set({ saveStatus: 'error' });
      }
    },

    loadDocument: (document: Document) => {
      set(state => {
        state.documentId = document.id;
        state.title = document.title;
        state.rootId = document.root.id;

        const nodesMap: Record<string, StoredOutlineNode> = {};

        const flattenNode = (node: OutlineNode, parentId: string | null = null) => {
          const childrenIds = node.children.map(child => child.id);

          nodesMap[node.id] = {
            ...node,
            parentId,
            children: childrenIds,
          } as StoredOutlineNode;

          node.children.forEach(child => flattenNode(child, node.id));
        };

        flattenNode(document.root, null);
        state.nodes = nodesMap;
      });

      console.log('✅ Document loaded:', document.id);
    },

    moveNode: (activeId, overId, type) => {
      set(state => {
        const activeNode = state.nodes[activeId];
        const overNode = state.nodes[overId];
        
        if (!activeNode || !overNode) return;
        
        const oldParentId = activeNode.parentId;
        if (!oldParentId) return; // Cannot move root or detached nodes

        // Remove from old parent
        const oldParent = state.nodes[oldParentId];
        oldParent.children = oldParent.children.filter(id => id !== activeId);

        if (type === 'inside') {
          // Add as first child of overNode
          state.nodes[overId].children.unshift(activeId);
          state.nodes[activeId].parentId = overId;
        } else {
          // Add as sibling of overNode
          const newParentId = overNode.parentId;
          if (!newParentId) {
             // Should not happen if overNode is not root
             // Restore if failed
             oldParent.children.push(activeId);
             return;
          }
          
          const newParent = state.nodes[newParentId];
          const overIndex = newParent.children.indexOf(overId);
          
          if (type === 'before') {
            newParent.children.splice(overIndex, 0, activeId);
          } else {
            newParent.children.splice(overIndex + 1, 0, activeId);
          }
          state.nodes[activeId].parentId = newParentId;
        }
        
        state.nodes[activeId].updatedAt = Date.now();
      });
      get().saveDocument();
    },

    initializeWithData: (nodes, rootId, title) => {
      set({
        nodes,
        rootId,
        title,
        documentId: crypto.randomUUID(),
      });
      console.log('✅ Initialized with data:', title);
    },

    fetchDocuments: async () => {
      set({ isLoadingDocuments: true });
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const userId = getCurrentUserId();
        const docs = url && key && userId
          ? await supabaseDocumentDb.listDocuments(userId)
          : await documentDb.listDocuments();
        const filteredDocs = docs.filter(d => d.title !== '读书笔记《我们如何学习》');
        set({ documents: filteredDocs });
        console.log('✅ Fetched documents:', filteredDocs.length);
        return filteredDocs;
      } catch (error) {
        console.error('❌ Failed to fetch documents:', error);
        return [];
      } finally {
        set({ isLoadingDocuments: false });
      }
    },

    pushHistory: () => {
      set(state => {
        const MAX_HISTORY = 30;
        
        // 创建当前状态的快照
        const snapshot: HistoryState = {
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          rootId: state.rootId,
          title: state.title,
        };

        if (state.history.present) {
          state.history.past.push(state.history.present);
        }

        state.history.present = snapshot;
        state.history.future = [];

        if (state.history.past.length > MAX_HISTORY) {
          state.history.past.shift();
        }

        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;
      });
    },

    undo: () => {
      const state = get();
      const { past, present, future } = state.history;

      if (past.length === 0 || !present) {
        console.log('⚠️ Cannot undo: no history');
        return;
      }

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      set({
        history: {
          past: newPast,
          present: previous,
          future: [present, ...future],
        },
        nodes: previous.nodes,
        rootId: previous.rootId,
        title: previous.title,
        canUndo: newPast.length > 0,
        canRedo: true,
      });

      console.log('↶ Undo performed');
    },

    redo: () => {
      const state = get();
      const { past, present, future } = state.history;

      if (future.length === 0) {
        console.log('⚠️ Cannot redo: no future');
        return;
      }

      const next = future[0];
      const newFuture = future.slice(1);

      set({
        history: {
          past: [...past, present!],
          present: next,
          future: newFuture,
        },
        nodes: next.nodes,
        rootId: next.rootId,
        title: next.title,
        canUndo: true,
        canRedo: newFuture.length > 0,
      });

      console.log('↷ Redo performed');
    },
  }))
);

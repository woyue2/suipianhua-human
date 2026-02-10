'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StoredOutlineNode, OutlineNode, Document, ImageAttachment } from '@/types';
import { LineSpacingType, DEFAULTS } from '@/lib/constants';
import { documentDb } from '@/lib/db';
import { supabaseDocumentDb } from '@/lib/supabase-db';
import { getCurrentUserId } from '@/lib/auth-context';

const AUTO_SAVE_KEY = 'auto-save-enabled';
const initialAutoSaveEnabled = typeof window !== 'undefined'
  ? localStorage.getItem(AUTO_SAVE_KEY)
  : null;
const resolvedAutoSaveEnabled =
  initialAutoSaveEnabled === null ? true : initialAutoSaveEnabled === 'true';

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

  // Selection
  isSelectionMode: boolean;
  selectedNodeIds: string[];

  // 自动保存状态
  autoSaveEnabled: boolean;
  lastSavedAt: number | null;
  lastEditedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // 历史栈
  history: {
    past: HistoryState[];
    present: HistoryState | null;
    future: HistoryState[];
  };

  // Document list
  documents: Array<{ id: string; title: string; updatedAt: number; deletedAt?: number | null; icon?: string; searchableText?: string }>;
  isLoadingDocuments: boolean;

  // 全局工具栏状态（确保同一时间只有一个工具栏显示）
  activeToolbarNodeId: string | null;
  activeFormatToolbarNodeId: string | null;
  setActiveToolbarNodeId: (nodeId: string | null) => void;
  setActiveFormatToolbarNodeId: (nodeId: string | null) => void;

  // Selection Actions
  toggleSelectionMode: () => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  // Actions - 基础操作
  updateNodeContent: (id: string, content: string) => void;
  updateNodeIcon: (id: string, icon: string) => void;
  toggleCollapse: (id: string) => void;
  addImage: (nodeId: string, image: ImageAttachment) => void;
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
  toggleDarkMode: () => void;
  setLineSpacing: (spacing: LineSpacingType) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setTitle: (title: string) => void;

  // 辅助方法
  buildDocumentTree: () => Document;
  loadDocument: (document: Document) => void;
  saveDocument: () => Promise<void>;
  fetchDocuments: () => Promise<Array<{ id: string; title: string; updatedAt: number; deletedAt?: number | null; icon?: string; searchableText?: string }>>;

  // 初始化
  initializeWithData: (nodes: Record<string, StoredOutlineNode>, rootId: string, title: string) => void;

  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  autoSaveNow: () => void;

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
    isSelectionMode: false,
    selectedNodeIds: [],
    autoSaveEnabled: resolvedAutoSaveEnabled,
    lastSavedAt: null,
    lastEditedAt: null,
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
      const now = Date.now();
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].content = content;
          state.nodes[id].updatedAt = now;
          state.lastEditedAt = now;
        }
      });
      
      // ✅ 内容更新后自动保存历史（用于撤销/重做）
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    updateNodeIcon: (id, icon) => {
      const now = Date.now();
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].icon = icon;
          state.nodes[id].updatedAt = now;
          state.lastEditedAt = now;

          // Sync with documents list if it's the root node
          if (id === state.rootId) {
            const docIndex = state.documents.findIndex(d => d.id === state.documentId);
            if (docIndex !== -1) {
              state.documents[docIndex].icon = icon;
              state.documents[docIndex].updatedAt = now;
            }
          }
        }
      });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    toggleCollapse: (id) => {
      const now = Date.now();
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].collapsed = !state.nodes[id].collapsed;
          state.nodes[id].updatedAt = now;
          state.lastEditedAt = now;
        }
      });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    addImage: (nodeId, image) => {
      const now = Date.now();
      set(state => {
        if (state.nodes[nodeId]) {
          // immer 会自动处理不可变性
          state.nodes[nodeId].images.push(image);
          state.nodes[nodeId].updatedAt = now;
          state.lastEditedAt = now;
        }
      });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    removeImage: (nodeId, imageId) => {
      const now = Date.now();
      set(state => {
        if (state.nodes[nodeId]) {
          state.nodes[nodeId].images = state.nodes[nodeId].images.filter(
            img => img.id !== imageId
          );
          state.nodes[nodeId].updatedAt = now;
          state.lastEditedAt = now;
        }
      });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
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
        state.lastEditedAt = now;
      });

      console.log('➕ Added child node:', newId);
      set({ focusedNodeId: newId });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
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
        state.lastEditedAt = now;
      });

      console.log('➕ Added sibling node:', newId);
      set({ focusedNodeId: newId });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
      return newId;
    },

    // 删除节点
    deleteNode: (nodeId) => {
      const now = Date.now();
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
        parent.updatedAt = now;
        state.lastEditedAt = now;
      });

      console.log('🗑️ Deleted node:', nodeId);
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    // 增加缩进（变成上一个兄弟节点的子节点）
    indentNode: (nodeId) => {
      const now = Date.now();
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

        parent.updatedAt = now;
        prevSibling.updatedAt = now;
        state.lastEditedAt = now;
      });

      console.log('→ Indented node:', nodeId);
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    // 减少缩进（变成父节点的兄弟节点）
    outdentNode: (nodeId) => {
      const now = Date.now();
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

        parent.updatedAt = now;
        grandParent.updatedAt = now;
        state.lastEditedAt = now;
      });

      console.log('← Outdented node:', nodeId);
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    // 上移节点
    moveNodeUp: (nodeId) => {
      const now = Date.now();
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

        parent.updatedAt = now;
        state.lastEditedAt = now;
      });

      console.log('↑ Moved node up:', nodeId);
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    // 下移节点
    moveNodeDown: (nodeId) => {
      const now = Date.now();
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

        parent.updatedAt = now;
        state.lastEditedAt = now;
      });

      console.log('↓ Moved node down:', nodeId);
      setTimeout(() => {
        get().pushHistory();
      }, 0);
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTO_SAVE_KEY, String(enabled));
      }
      console.log('💾 Auto save enabled changed to:', enabled);
    },

    setTitle: (title) => {
      const now = Date.now();
      set({ title, lastEditedAt: now });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    setActiveToolbarNodeId: (nodeId) => {
      set({ activeToolbarNodeId: nodeId });
    },

    setActiveFormatToolbarNodeId: (nodeId) => {
      set({ activeFormatToolbarNodeId: nodeId });
    },

    toggleSelectionMode: () => {
      set(state => {
        state.isSelectionMode = !state.isSelectionMode;
        if (!state.isSelectionMode) {
          state.selectedNodeIds = [];
        }
      });
    },

    toggleNodeSelection: (id) => {
      set(state => {
        const getAllDescendants = (nodeId: string): string[] => {
          const node = state.nodes[nodeId];
          if (!node) return [];
          let ids: string[] = [];
          for (const childId of node.children) {
            ids.push(childId);
            ids = ids.concat(getAllDescendants(childId));
          }
          return ids;
        };

        const descendants = getAllDescendants(id);
        const allIds = [id, ...descendants];
        const isSelected = state.selectedNodeIds.includes(id);

        if (isSelected) {
          // Deselect node and all its descendants
          state.selectedNodeIds = state.selectedNodeIds.filter(nodeId => !allIds.includes(nodeId));
        } else {
          // Select node and all its descendants
          const newIds = allIds.filter(nodeId => !state.selectedNodeIds.includes(nodeId));
          state.selectedNodeIds.push(...newIds);
        }
      });
    },

    clearSelection: () => {
      set({ selectedNodeIds: [] });
    },

    selectAll: (ids) => {
      set({ selectedNodeIds: ids });
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
        state.history.present = {
          nodes: JSON.parse(JSON.stringify(nodesMap)),
          rootId: document.root.id,
          title: document.title,
        };
        state.history.past = [];
        state.history.future = [];
        state.canUndo = false;
        state.canRedo = false;
      });

      console.log('✅ Document loaded:', document.id);
    },

    moveNode: (activeId, overId, type) => {
      const now = Date.now();
      set(state => {
        const activeNode = state.nodes[activeId];
        const overNode = state.nodes[overId];
        
        if (!activeNode || !overNode) return;
        
        const oldParentId = activeNode.parentId;
        if (!oldParentId) return; // Cannot move root or detached nodes

        // Remove from old parent
        const oldParent = state.nodes[oldParentId];
        oldParent.children = oldParent.children.filter(id => id !== activeId);

        const updateLevel = (id: string, level: number) => {
          const node = state.nodes[id];
          if (!node) return;
          node.level = level;
          node.children.forEach(childId => updateLevel(childId, level + 1));
        };

        if (type === 'inside') {
          // Add as first child of overNode
          state.nodes[overId].children.unshift(activeId);
          state.nodes[activeId].parentId = overId;
          updateLevel(activeId, overNode.level + 1);
          overNode.updatedAt = now;
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
          updateLevel(activeId, overNode.level);
          newParent.updatedAt = now;
        }
        
        state.nodes[activeId].updatedAt = now;
        oldParent.updatedAt = now;
        state.lastEditedAt = now;
      });
      setTimeout(() => {
        get().pushHistory();
      }, 0);
    },

    initializeWithData: (nodes, rootId, title) => {
      set({
        nodes,
        rootId,
        title,
        documentId: crypto.randomUUID(),
        history: {
          past: [],
          present: {
            nodes: JSON.parse(JSON.stringify(nodes)),
            rootId,
            title,
          },
          future: [],
        },
        canUndo: false,
        canRedo: false,
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
        if (!state.history.present) {
          state.history.present = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            rootId: state.rootId,
            title: state.title,
          };
          state.history.past = [];
          state.history.future = [];
          state.canUndo = false;
          state.canRedo = false;
          return;
        }
        const currentSnapshot = JSON.stringify({
          nodes: state.nodes,
          rootId: state.rootId,
          title: state.title,
        });
        const presentSnapshot = JSON.stringify(state.history.present);
        if (currentSnapshot === presentSnapshot) {
          return;
        }
        
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

    autoSaveNow: () => {
      const { autoSaveEnabled, saveStatus, lastEditedAt, lastSavedAt } = get();
      if (!autoSaveEnabled) return;
      if (saveStatus === 'saving') return;
      if (!lastEditedAt) return;
      if (!lastSavedAt || lastEditedAt > lastSavedAt) {
        get().saveDocument();
      }
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

      const now = Date.now();
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
        lastEditedAt: now,
      });

      console.log('↶ Undo performed');
      get().autoSaveNow();
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

      const now = Date.now();
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
        lastEditedAt: now,
      });

      console.log('↷ Redo performed');
      get().autoSaveNow();
    },
  }))
);

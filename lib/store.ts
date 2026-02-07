'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StoredOutlineNode, OutlineNode, Document } from '@/types';

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

  // 自动保存状态
  autoSaveEnabled: boolean;
  lastSavedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // 历史栈
  history: {
    past: Document[];
    present: Document | null;
    future: Document[];
  };

  // Document list
  documents: Array<{ id: string; title: string; updatedAt: number }>;
  isLoadingDocuments: boolean;

  // Actions - 直接通过 ID 操作，O(1) 复杂度
  updateNodeContent: (id: string, content: string) => void;
  toggleCollapse: (id: string) => void;
  addImage: (nodeId: string, image: any) => void;

  // UI Actions
  setShowAIModal: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  toggleDarkMode: () => void;

  // 辅助方法
  buildDocumentTree: () => Document;
  loadDocument: (document: Document) => void;
  saveDocument: () => Promise<void>;
  fetchDocuments: () => Promise<void>;

  // 初始化
  initializeWithData: (nodes: Record<string, StoredOutlineNode>, rootId: string, title: string) => void;

  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  pushHistory: (document: Document) => void;

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

    updateNodeContent: (id, content) => {
      set(state => {
        if (state.nodes[id]) {
          state.nodes[id].content = content;
          state.nodes[id].updatedAt = Date.now();
        }
      });
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
          state.nodes[nodeId].images.push(image);
        }
      });
    },

    setShowAIModal: (show) => {
      set({ showAIModal: show });
    },

    setShowSettings: (show) => {
      set({ showSettings: show });
    },

    toggleDarkMode: () => {
      set(state => {
        state.isDarkMode = !state.isDarkMode;
      });
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
      if (!state.autoSaveEnabled) return;

      try {
        set({ saveStatus: 'saving' });

        const document = state.buildDocumentTree();

        // 保存到 IndexedDB
        const { documentDb } = await import('@/lib/db');
        await documentDb.saveDocument(document);

        set({
          saveStatus: 'saved',
          lastSavedAt: Date.now(),
        });

        // 2秒后重置状态
        setTimeout(() => {
          set({ saveStatus: 'idle' });
        }, 2000);
      } catch (error) {
        console.error('Failed to save document:', error);
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
    },

    initializeWithData: (nodes, rootId, title) => {
      set({
        nodes,
        rootId,
        title,
        documentId: crypto.randomUUID(),
      });
    },

    fetchDocuments: async () => {
      set({ isLoadingDocuments: true });
      try {
        const { documentDb } = await import('@/lib/db');
        const docs = await documentDb.listDocuments();
        set({ documents: docs });
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        set({ isLoadingDocuments: false });
      }
    },

    pushHistory: (document) => {
      set(state => {
        const MAX_HISTORY = 30;
        const snapshot = JSON.parse(JSON.stringify(document));

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
      set(state => {
        const { past, present, future } = state.history;

        if (past.length === 0 || !present) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        state.history = {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };

        state.canUndo = newPast.length > 0;
        state.canRedo = true;

        get().loadDocument(previous);
      });
    },

    redo: () => {
      set(state => {
        const { past, present, future } = state.history;

        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        state.history = {
          past: [...past, present!],
          present: next,
          future: newFuture,
        };

        state.canUndo = true;
        state.canRedo = newFuture.length > 0;

        get().loadDocument(next);
      });
    },
  }))
);


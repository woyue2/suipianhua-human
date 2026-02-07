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
  
  // 初始化
  initializeWithData: (nodes: Record<string, StoredOutlineNode>, rootId: string, title: string) => void;
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
  }))
);


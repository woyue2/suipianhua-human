'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { reorganizeOutlineWithConfig } from '@/app/actions/ai';
import { generateId } from '@/utils/id';
import { calculateDiff } from '@/utils/tree-diff';
import { OutlineNode, ReorganizeChange, StoredOutlineNode } from '@/types';
import { AI_MODELS, type AIProvider, getDefaultProvider, getDefaultModel } from '@/lib/ai-config';
import { AIOutlineNode } from '@/lib/ai-schema';
import { toast } from 'sonner';
import { usePromptConfig } from '@/hooks/usePromptConfig';
import PromptSelector from '@/components/settings/PromptSelector';

interface AIReorganizeModalProps {
  onClose: () => void;
}

export const AIReorganizeModal = React.memo(({ onClose }: AIReorganizeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    reasoning: string;
    newTree: OutlineNode;
    changes: ReorganizeChange[];
  } | null>(null);

  // AI 配置状态
  const [provider, setProvider] = useState<AIProvider>(getDefaultProvider());
  const [model, setModel] = useState(() => getDefaultModel(provider));

  // 提示词配置
  const { prompts, loadPrompts, activePromptId: defaultPromptId, addCustomPrompt } = usePromptConfig();
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  // 初始化提示词
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // 当默认提示词ID加载完成后，设置选中状态
  useEffect(() => {
    if (defaultPromptId && !selectedPromptId) {
      setSelectedPromptId(defaultPromptId);
    }
  }, [defaultPromptId, selectedPromptId]);

  // ✅ 在组件顶层调用所有 hooks
  const buildDocumentTree = useEditorStore(s => s.buildDocumentTree);
  const loadDocument = useEditorStore(s => s.loadDocument);
  const saveDocument = useEditorStore(s => s.saveDocument);
  const nodes = useEditorStore(s => s.nodes);
  const focusedNodeId = useEditorStore(s => s.focusedNodeId);
  const selectedNodeIds = useEditorStore(s => s.selectedNodeIds);
  const rootId = useEditorStore(s => s.rootId);

  // 计算选中的顶层节点（排除其父节点也被选中的节点）
  const topLevelSelectedIds = React.useMemo(() => {
    return selectedNodeIds.filter(id => {
      const node = nodes[id];
      if (!node) return false;
      // 如果父节点不存在（是根节点）或者父节点没有被选中，则该节点是顶层选中节点
      return !node.parentId || !selectedNodeIds.includes(node.parentId);
    });
  }, [selectedNodeIds, nodes]);

  // 范围选择状态
  const [scope, setScope] = useState<'document' | 'selection'>('document');

  // 初始化范围：如果有选中的非根节点，默认选中该节点
  useEffect(() => {
    if (selectedNodeIds.length > 0) {
      setScope('selection');
    } else if (focusedNodeId && focusedNodeId !== rootId && nodes[focusedNodeId]) {
      setScope('selection');
    } else {
      setScope('document');
    }
  }, [focusedNodeId, rootId, nodes, selectedNodeIds]);

  // 当提供商改变时，更新默认模型
  useEffect(() => {
    setModel(getDefaultModel(provider));
  }, [provider]);

  const handleReorganize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let targetNode: OutlineNode;

      if (scope === 'selection') {
        if (topLevelSelectedIds.length > 0) {
          // 检查是否属于同一父节点
          const parents = new Set(topLevelSelectedIds.map(id => nodes[id]?.parentId));
          if (parents.size > 1) {
            throw new Error('选中节点必须属于同一个父节点才能进行重组');
          }
          
          // 构建虚拟根节点包含所有选中节点
          const parentId = nodes[topLevelSelectedIds[0]].parentId;
          const now = Date.now();
          targetNode = {
            id: 'virtual-root',
            parentId: parentId,
            content: 'Selected Content',
            level: 0,
            children: topLevelSelectedIds.map(id => buildSubTree(id, nodes)),
            images: [],
            collapsed: false,
            createdAt: now,
            updatedAt: now,
          } as OutlineNode;
        } else if (focusedNodeId && nodes[focusedNodeId]) {
          targetNode = buildSubTree(focusedNodeId, nodes);
        } else {
          // Fallback to document if nothing selected
          const currentDoc = buildDocumentTree();
          targetNode = currentDoc.root;
        }
      } else {
        const currentDoc = buildDocumentTree();
        targetNode = currentDoc.root;
      }

      const result = await reorganizeOutlineWithConfig(
        targetNode, 
        provider, 
        model,
        selectedPromptId // 传递选中的提示词ID
      );

      // 为 AI 返回的结构生成 ID
      const newTreeWithIds = addIdsToTree(result.newStructure);

      // 计算差异
      const changes = calculateDiff(targetNode, newTreeWithIds);

      setPreviewData({
        reasoning: result.reasoning,
        newTree: newTreeWithIds,
        changes,
      });
    } catch (err: unknown) {
      console.error('AI reorganize error:', err);
      const message = err instanceof Error ? err.message : 'AI 重组失败，请稍后重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!previewData) return;

    const currentDoc = buildDocumentTree();
    let newRoot: OutlineNode;

    if (scope === 'selection') {
      if (topLevelSelectedIds.length > 0) {
        // 多选替换：在父节点中替换多个子节点
        const parentId = nodes[topLevelSelectedIds[0]].parentId;
        if (parentId) {
          newRoot = replaceMultipleNodesInTree(currentDoc.root, parentId, topLevelSelectedIds, previewData.newTree.children);
        } else {
          // 如果是根节点的子节点（虽然 parentId 应该是 null? 不，root 的 children 的 parentId 是 rootId）
          // 如果选中的是 root 节点本身？selectedNodeIds 不应该包含 rootId
           newRoot = previewData.newTree; // Fallback
        }
      } else if (focusedNodeId) {
        // 局部替换：在原树中找到目标节点并替换
        newRoot = replaceNodeInTree(currentDoc.root, focusedNodeId, previewData.newTree);
      } else {
        newRoot = previewData.newTree;
      }
    } else {
      // 全局替换
      newRoot = previewData.newTree;
    }

    // 为AI返回的树添加ID并恢复格式信息
    const newDoc = {
      ...currentDoc,
      root: newRoot,
      metadata: {
        ...currentDoc.metadata,
        updatedAt: Date.now(),
      },
    };

    loadDocument(newDoc);

    // ✅ 自动保存到IndexedDB - 直接使用顶层获取的 saveDocument
    await saveDocument();

    toast.success('AI重组已保存');
    onClose();
  };

  // 辅助函数：构建子树
  const buildSubTree = (nodeId: string, nodesMap: Record<string, StoredOutlineNode>): OutlineNode => {
    const storedNode = nodesMap[nodeId];
    if (!storedNode) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    return {
      ...storedNode,
      children: storedNode.children.map(childId => buildSubTree(childId, nodesMap)),
    } as OutlineNode;
  };

  // 辅助函数：替换树中的节点
  const replaceNodeInTree = (root: OutlineNode, targetId: string, replacement: OutlineNode): OutlineNode => {
    if (root.id === targetId) {
      return replacement;
    }
    return {
      ...root,
      children: root.children.map(child => replaceNodeInTree(child, targetId, replacement))
    };
  };

  // 辅助函数：替换树中的多个节点（必须是同一父节点下的兄弟节点）
  const replaceMultipleNodesInTree = (root: OutlineNode, targetParentId: string, oldIds: string[], newNodes: OutlineNode[]): OutlineNode => {
    if (root.id === targetParentId) {
      const resultChildren: OutlineNode[] = [];
      let inserted = false;
      for (const child of root.children) {
        if (oldIds.includes(child.id)) {
          if (!inserted) {
            resultChildren.push(...newNodes);
            inserted = true;
          }
        } else {
          resultChildren.push(child);
        }
      }
      return { ...root, children: resultChildren };
    }
    return {
      ...root,
      children: root.children.map(child => replaceMultipleNodesInTree(child, targetParentId, oldIds, newNodes))
    };
  };

  // 为树结构添加 ID 并恢复格式信息
  const addIdsToTree = (node: AIOutlineNode): OutlineNode => {
    const now = Date.now();
    const parsed = parseFormatInfo(node.content);
    const rootId = generateId();

    return {
      id: rootId,
      parentId: null,
      content: parsed.content,
      level: 0,
      isItalic: node.isItalic || parsed.isItalic,
      isHeader: node.isHeader,
      isSubHeader: node.isSubHeader,
      tags: node.tags || [],
      icon: node.icon,
      children: node.children.map((child) => addIdsToTreeRecursive(child, 1, rootId)),
      images: [],
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  const addIdsToTreeRecursive = (node: AIOutlineNode, level: number, parentId: string | null): OutlineNode => {
    const now = Date.now();
    const parsed = parseFormatInfo(node.content);
    const nodeId = generateId();

    return {
      id: nodeId,
      parentId,
      content: parsed.content,
      level,
      isItalic: node.isItalic || parsed.isItalic,
      isHeader: node.isHeader,
      isSubHeader: node.isSubHeader,
      tags: node.tags || [],
      icon: node.icon,
      children: node.children.map((child) => addIdsToTreeRecursive(child, level + 1, nodeId)),
      images: [],
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * 从内容中解析格式信息
   * 检测 **text**, *text* 等Markdown格式标记
   */
  function parseFormatInfo(content: string): {
    content: string;
    isItalic?: boolean;
  } {
    let cleanContent = content;
    let isItalic = false;

    const isBold = cleanContent.startsWith('**') && cleanContent.endsWith('**') && cleanContent.length > 4;
    const isUnderline = cleanContent.startsWith('__') && cleanContent.endsWith('__') && cleanContent.length > 4;
    if (isBold || isUnderline) {
      return { content: cleanContent };
    }

    // 检测斜体 *text*
    if (cleanContent.startsWith('*') && cleanContent.endsWith('*') && cleanContent.length > 2) {
      isItalic = true;
      cleanContent = cleanContent.slice(1, -1);
    }

    return {
      content: cleanContent,
      isItalic,
    };
  }

  const providerName = {
    openai: 'OpenAI',
    zhipu: '智谱AI',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 shadow-xl w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-none sm:rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            AI 智能重组
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            使用 AI 自动识别主题并建立层级分类关系
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!previewData && !isLoading && (
            <div className="space-y-6">
              {/* AI 配置选择 */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
                {/* 提示词选择 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    整理风格
                  </label>
                  <PromptSelector
                    prompts={prompts}
                    value={selectedPromptId}
                    onChange={setSelectedPromptId}
                    onAddCustomPrompt={async (prompt) => {
                      await addCustomPrompt({
                        name: prompt.name,
                        description: prompt.description,
                        systemPrompt: prompt.systemPrompt
                      });
                      await loadPrompts();
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    AI 提供商
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(AI_MODELS).map(([key]) => (
                      <button
                        key={key}
                        onClick={() => setProvider(key as AIProvider)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          provider === key
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {providerName[key as AIProvider]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    模型
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                    {AI_MODELS[provider].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-center py-8">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  点击下方按钮，让 AI 帮你整理大纲结构
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  当前使用：{providerName[provider]} - {AI_MODELS[provider].find(m => m.id === model)?.name}
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                AI 正在分析和重组中...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                使用：{providerName[provider]} - {AI_MODELS[provider].find(m => m.id === model)?.name}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {previewData && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  AI 分析说明
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  {previewData.reasoning}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  检测到 {previewData.changes.length} 处变更
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewData.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm bg-slate-50 dark:bg-slate-700 p-3 rounded"
                    >
                      <span className="text-lg">
                        {change.type === 'move' ? '🔄' : '✨'}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {change.description}
                        </div>
                        {change.toPath.length > 0 && (
                          <div className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                            → {change.toPath.join(' / ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          {!previewData ? (
            <button
              onClick={handleReorganize}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '分析中...' : '开始重组'}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              应用重组
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

AIReorganizeModal.displayName = 'AIReorganizeModal';

'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { reorganizeOutlineWithConfig } from '@/app/actions/ai';
import { generateId } from '@/utils/id';
import { calculateDiff } from '@/utils/tree-diff';
import { OutlineNode } from '@/types';
import { AI_MODELS, type AIProvider, getDefaultProvider, getDefaultModel } from '@/lib/ai-config';

interface AIReorganizeModalProps {
  onClose: () => void;
}

export const AIReorganizeModal: React.FC<AIReorganizeModalProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    reasoning: string;
    newTree: OutlineNode;
    changes: any[];
  } | null>(null);

  // AI 配置状态
  const [provider, setProvider] = useState<AIProvider>(getDefaultProvider());
  const [model, setModel] = useState(() => getDefaultModel(provider));

  const buildDocumentTree = useEditorStore(s => s.buildDocumentTree);
  const loadDocument = useEditorStore(s => s.loadDocument);

  // 当提供商改变时，更新默认模型
  useEffect(() => {
    setModel(getDefaultModel(provider));
  }, [provider]);

  const handleReorganize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentDoc = buildDocumentTree();
      const result = await reorganizeOutlineWithConfig(currentDoc.root, provider, model);

      // 为 AI 返回的结构生成 ID
      const newTreeWithIds = addIdsToTree(result.newStructure);

      // 计算差异
      const changes = calculateDiff(currentDoc.root, newTreeWithIds);

      setPreviewData({
        reasoning: result.reasoning,
        newTree: newTreeWithIds,
        changes,
      });
    } catch (err: any) {
      console.error('AI reorganize error:', err);
      setError(err?.message || 'AI 重组失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!previewData) return;

    const currentDoc = buildDocumentTree();
    const newDoc = {
      ...currentDoc,
      root: previewData.newTree,
      metadata: {
        ...currentDoc.metadata,
        updatedAt: Date.now(),
      },
    };

    loadDocument(newDoc);
    onClose();
  };

  // 为树结构添加 ID
  const addIdsToTree = (node: any): OutlineNode => {
    const now = Date.now();
    return {
      id: generateId(),
      parentId: null,
      content: node.content,
      level: 0,
      children: node.children.map((child: any) => addIdsToTreeRecursive(child, 1)),
      images: [],
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  const addIdsToTreeRecursive = (node: any, level: number): OutlineNode => {
    const now = Date.now();
    return {
      id: generateId(),
      parentId: null,
      content: node.content,
      level,
      children: node.children.map((child: any) => addIdsToTreeRecursive(child, level + 1)),
      images: [],
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  const providerName = {
    openai: 'OpenAI',
    zhipu: '智谱AI',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    AI 提供商
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(AI_MODELS).map(([key, models]) => (
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
};

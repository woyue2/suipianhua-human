'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { generateId } from '@/utils/id';
import { OutlineTree } from '@/components/editor/OutlineTree';

export default function Home() {
  const initializeWithData = useEditorStore((state) => state.initializeWithData);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const saveDocument = useEditorStore((state) => state.saveDocument);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const showAIModal = useEditorStore((state) => state.showAIModal);
  const showSettings = useEditorStore((state) => state.showSettings);
  const setShowAIModal = useEditorStore((state) => state.setShowAIModal);
  const setShowSettings = useEditorStore((state) => state.setShowSettings);
  const buildDocumentTree = useEditorStore((state) => state.buildDocumentTree);
  const loadDocument = useEditorStore((state) => state.loadDocument);
  const fetchDocuments = useEditorStore((state) => state.fetchDocuments);

  const [importError, setImportError] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    // Create test document with nested structure
    const now = Date.now();
    const rootId = generateId();
    const child1Id = generateId();
    const child2Id = generateId();
    const grandchild1Id = generateId();

    const testNodes = {
      [rootId]: {
        id: rootId,
        parentId: null,
        content: '根节点',
        level: 0,
        children: [child1Id, child2Id],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [child1Id]: {
        id: child1Id,
        parentId: rootId,
        content: '子节点 1',
        level: 1,
        children: [grandchild1Id],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [child2Id]: {
        id: child2Id,
        parentId: rootId,
        content: '子节点 2',
        level: 1,
        children: [],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [grandchild1Id]: {
        id: grandchild1Id,
        parentId: child1Id,
        content: '孙节点 1',
        level: 2,
        children: [],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
    };

    initializeWithData(testNodes, rootId, '测试文档');
  }, [initializeWithData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSave = async () => {
    await saveDocument();
  };

  const handleNew = () => {
    if (confirm('确定要创建新文档吗？当前未保存的内容将丢失。')) {
      const now = Date.now();
      const rootId = generateId();

      const newNode = {
        [rootId]: {
          id: rootId,
          parentId: null,
          content: '新文档',
          level: 0,
          children: [],
          images: [],
          collapsed: false,
          createdAt: now,
          updatedAt: now,
        },
      };

      initializeWithData(newNode, rootId, '新文档');
    }
  };

  const handleImport = () => {
    const input = window.document.createElement('input') as HTMLInputElement;
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const doc = JSON.parse(text);
        loadDocument(doc);
        setImportError(null);
      } catch (error) {
        console.error('Import error:', error);
        setImportError('导入失败：文件格式不正确');
      }
    };
    input.click();
  };

  const handleExport = () => {
    try {
      const doc = buildDocumentTree();
      const blob = new Blob([JSON.stringify(doc, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'outline'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setImportError('导出失败');
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return '已保存';
      case 'error':
        return '保存失败';
      default:
        return '保存';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 大纲编辑器
          </h1>
          <p className="text-sm text-gray-600">
            快捷键: Ctrl+Z 撤销 | Ctrl+Y 重做 | Ctrl+S 保存
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-t-lg border border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleNew}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="创建新文档"
          >
            新建
          </button>

          <button
            onClick={handleSave}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              saveStatus === 'saved'
                ? 'text-green-700 bg-green-50 border-green-300'
                : saveStatus === 'error'
                ? 'text-red-700 bg-red-50 border-red-300'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
            title="保存文档 (Ctrl+S)"
          >
            {getSaveButtonText()}
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
            title="撤销 (Ctrl+Z)"
          >
            撤销
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
            title="重做 (Ctrl+Y)"
          >
            重做
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="导入文档"
          >
            导入
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="导出文档"
          >
            导出
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => setShowAIModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="AI 重组"
          >
            AI 重组
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="设置"
          >
            设置
          </button>
        </div>

        {/* Error Display */}
        {importError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{importError}</p>
            <button
              onClick={() => setImportError(null)}
              className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* Editor */}
        <div className="bg-white rounded-b-lg shadow-md border border-t-0 border-gray-200">
          <OutlineTree />
        </div>

        {/* AI Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI 重组</h2>
              <p className="text-gray-600 mb-4">
                此功能将使用 AI 重新组织您的大纲结构。
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    alert('AI 重组功能将在后续版本中实现');
                    setShowAIModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  开始重组
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">设置</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">自动保存</span>
                  <button
                    onClick={() => {
                      alert('自动保存设置将在后续版本中实现');
                    }}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600"
                  >
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">深色模式</span>
                  <button
                    onClick={() => {
                      alert('深色模式将在后续版本中实现');
                    }}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200"
                  >
                    <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

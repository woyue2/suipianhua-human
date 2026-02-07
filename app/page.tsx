'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { generateId } from '@/utils/id';
import { StoredOutlineNode, OutlineNode } from '@/types';

export default function Home() {
  const nodes = useEditorStore(s => s.nodes);
  const rootId = useEditorStore(s => s.rootId);
  const documentId = useEditorStore(s => s.documentId);
  const title = useEditorStore(s => s.title);
  const buildDocumentTree = useEditorStore(s => s.buildDocumentTree);
  const saveDocument = useEditorStore(s => s.saveDocument);
  const loadDocument = useEditorStore(s => s.loadDocument);
  const initializeWithData = useEditorStore(s => s.initializeWithData);
  const saveStatus = useEditorStore(s => s.saveStatus);
  const lastSavedAt = useEditorStore(s => s.lastSavedAt);

  const [documentStructure, setDocumentStructure] = useState<string>('');

  // 创建测试文档
  const createTestDocument = () => {
    const now = Date.now();

    // 创建 root 节点
    const rootId = generateId();
    const childId = generateId();
    const grandchildId1 = generateId();
    const grandchildId2 = generateId();

    const testNodes: Record<string, StoredOutlineNode> = {
      [rootId]: {
        id: rootId,
        parentId: null,
        content: '根节点',
        level: 0,
        children: [childId],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [childId]: {
        id: childId,
        parentId: rootId,
        content: '子节点',
        level: 1,
        children: [grandchildId1, grandchildId2],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [grandchildId1]: {
        id: grandchildId1,
        parentId: childId,
        content: '孙节点 1',
        level: 2,
        children: [],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [grandchildId2]: {
        id: grandchildId2,
        parentId: childId,
        content: '孙节点 2',
        level: 2,
        children: [],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
    };

    initializeWithData(testNodes, rootId, '测试文档');
    console.log('Test document created:', { rootId, documentId, title: '测试文档' });
  };

  // 显示文档结构
  const displayDocumentStructure = () => {
    try {
      const document = buildDocumentTree();
      const structure = JSON.stringify(document, null, 2);
      setDocumentStructure(structure);
      console.log('Document structure:', document);
    } catch (error) {
      console.error('Failed to build document tree:', error);
      setDocumentStructure('Error: ' + (error as Error).message);
    }
  };

  // 测试保存功能
  const handleSaveDocument = async () => {
    await saveDocument();
    displayDocumentStructure();
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return '未保存';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Tree Index - Phase 1 测试页面
        </h1>

        {/* 操作按钮区 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">操作面板</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={createTestDocument}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              创建测试文档
            </button>
            <button
              onClick={displayDocumentStructure}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              显示文档结构
            </button>
            <button
              onClick={handleSaveDocument}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              测试保存
            </button>
          </div>

          {/* 保存状态 */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">保存状态:</span>
              <span className={`px-2 py-1 rounded ${
                saveStatus === 'saved' ? 'bg-green-200 text-green-800' :
                saveStatus === 'saving' ? 'bg-yellow-200 text-yellow-800' :
                saveStatus === 'error' ? 'bg-red-200 text-red-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {saveStatus === 'saved' ? '已保存' :
                 saveStatus === 'saving' ? '保存中...' :
                 saveStatus === 'error' ? '保存失败' :
                 '空闲'}
              </span>
            </div>
            {lastSavedAt && (
              <div className="text-sm text-gray-600 mt-1">
                上次保存时间: {formatTimestamp(lastSavedAt)}
              </div>
            )}
          </div>
        </div>

        {/* 文档信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">文档信息</h2>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">文档 ID:</span> {documentId || '未创建'}</div>
            <div><span className="font-medium">标题:</span> {title || '无'}</div>
            <div><span className="font-medium">根节点 ID:</span> {rootId || '无'}</div>
            <div><span className="font-medium">节点总数:</span> {Object.keys(nodes).length}</div>
          </div>
        </div>

        {/* 节点列表 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">节点列表</h2>
          {Object.keys(nodes).length === 0 ? (
            <p className="text-gray-500">暂无节点，请先创建测试文档</p>
          ) : (
            <div className="space-y-2">
              {Object.values(nodes).map(node => (
                <div
                  key={node.id}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                  style={{ marginLeft: `${node.level * 20}px` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-600">{node.id.slice(0, 8)}...</span>
                    <span className="text-gray-700">{node.content}</span>
                    <span className="text-xs text-gray-500">
                      (Level {node.level}, Children: {node.children.length})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Parent: {node.parentId ? node.parentId.slice(0, 8) + '...' : 'None'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 文档结构 JSON */}
        {documentStructure && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">文档结构 (JSON)</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {documentStructure}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

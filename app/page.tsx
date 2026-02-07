'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { generateId } from '@/utils/id';
import { OutlineTree } from '@/components/editor/OutlineTree';

export default function Home() {
  const initializeWithData = useEditorStore((state) => state.initializeWithData);

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          大纲编辑器
        </h1>
        <div className="bg-white rounded-lg shadow-md">
          <OutlineTree />
        </div>
      </div>
    </main>
  );
}

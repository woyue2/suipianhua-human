'use client';

import { useEditorStore } from '@/lib/store';
import { OutlineNode } from './OutlineNode';

export function OutlineTree() {
  const rootId = useEditorStore((state) => state.rootId);
  const nodes = useEditorStore((state) => state.nodes);

  if (!rootId || !nodes[rootId]) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        暂无内容，请先创建文档
      </div>
    );
  }

  // Recursive render function
  const renderNode = (nodeId: string, depth: number = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    return (
      <div key={nodeId}>
        <OutlineNode nodeId={nodeId} depth={depth} />
        {node.children.length > 0 && !node.collapsed && (
          <div>
            {node.children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-4">
      {renderNode(rootId)}
    </div>
  );
}

'use client';

import { memo } from 'react';
import { useEditorStore } from '@/lib/store';
import { StoredOutlineNode } from '@/types';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore((state) => state.nodes[nodeId]);
  const updateContent = useEditorStore((state) => state.updateNodeContent);
  const toggleCollapse = useEditorStore((state) => state.toggleCollapse);

  if (!node) return null;

  return (
    <div className="flex items-center group" style={{ marginLeft: depth * 24 }}>
      {/* Collapse/Expand Arrow */}
      <button
        onClick={() => toggleCollapse(nodeId)}
        className="mr-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        {node.children.length > 0 ? (node.collapsed ? '▶' : '▼') : '•'}
      </button>

      {/* Editable Content */}
      <input
        type="text"
        value={node.content}
        onChange={(e) => updateContent(nodeId, e.target.value)}
        className="flex-1 border-none bg-transparent outline-none px-2 py-1 text-gray-900 placeholder-gray-400"
        placeholder="输入节点内容..."
      />

      {/* Image Attachment Indicator */}
      {node.images.length > 0 && (
        <span className="ml-2 text-sm text-gray-500">
          📷 {node.images.length}
        </span>
      )}
    </div>
  );
});

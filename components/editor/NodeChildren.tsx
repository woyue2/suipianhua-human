import React, { memo } from 'react';

interface NodeChildrenProps {
  childIds: string[];
  depth: number;
  renderNode: (childId: string, depth: number) => React.ReactNode;
}

/**
 * 节点子节点容器组件
 * 递归渲染子节点
 */
export const NodeChildren = memo(function NodeChildren({
  childIds,
  depth,
  renderNode,
}: NodeChildrenProps) {
  if (!childIds || childIds.length === 0) {
    return null;
  }

  return (
    <div className="ml-1 pl-6 mt-2 border-l-2 border-slate-100 dark:border-slate-800">
      {childIds.map(childId => renderNode(childId, depth + 1))}
    </div>
  );
});

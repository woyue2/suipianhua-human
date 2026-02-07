'use client';

import React, { memo } from 'react';
import { useEditorStore } from '@/lib/store';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

// OutlineNode: 递归大纲节点组件，根据 depth 控制缩进
export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);
  const toggleCollapse = useEditorStore(s => s.toggleCollapse);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  const textStyle = () => {
    if (node.isHeader) return "text-xl font-bold text-slate-800 dark:text-slate-200";
    if (node.isSubHeader) return "text-lg font-bold text-slate-700 dark:text-slate-300";
    return "text-slate-600 dark:text-slate-400";
  };

  const getBulletClass = () => {
    const base = "w-2 h-2 rounded-full mt-2.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-125 ";
    if (hasChildren) return base + "bg-primary";
    return base + "bg-slate-300 dark:bg-slate-600";
  };

  return (
    <div className={`flex flex-col ${depth === 0 ? 'mb-8' : 'mt-2'}`}>
      <div className="group flex items-start gap-3 relative">
        <div 
          onClick={() => hasChildren && toggleCollapse(nodeId)}
          className={getBulletClass()}
        />
        
        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-2 flex-wrap ${textStyle()}`}>
            {node.icon && <span className="mr-1">{node.icon}</span>}
            <input
              type="text"
              value={node.content}
              onChange={(e) => updateContent(nodeId, e.target.value)}
              className={`node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0
                ${node.isItalic ? 'italic text-slate-500' : ''}
                ${node.isSubHeader && node.tags?.includes('#重点') ? 'text-primary' : ''}
              `}
            />
            
            {node.tags?.map(tag => (
              <span key={tag} className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!isCollapsed && hasChildren && (
        <div className="ml-1 pl-6 mt-2 border-l-2 border-slate-100 dark:border-slate-800">
          {node.children.map(childId => (
            <OutlineNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});


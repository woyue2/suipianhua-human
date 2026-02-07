'use client';

import React from 'react';
import { useEditorStore } from '@/lib/store';
import { OutlineNode } from './OutlineNode';

export const OutlineTree: React.FC = () => {
  const rootId = useEditorStore(s => s.rootId);
  const nodes = useEditorStore(s => s.nodes);
  const title = useEditorStore(s => s.title);

  if (!rootId || !nodes[rootId]) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        暂无内容
      </div>
    );
  }

  const rootNode = nodes[rootId];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 lg:px-24">
      <header className="mb-12">
        <h1 className="text-4xl font-bold flex items-center gap-4 group">
          <span className="text-3xl">{rootNode.icon || '📚'}</span>
          <span className="focus:outline-none">
            {title}
          </span>
        </h1>
      </header>
      
      <div className="space-y-6">
        {rootNode.children.map(childId => (
          <OutlineNode key={childId} nodeId={childId} depth={0} />
        ))}
      </div>
    </div>
  );
};

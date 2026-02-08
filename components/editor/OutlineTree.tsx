'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { OutlineNode } from './OutlineNode';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';

export const OutlineTree: React.FC = () => {
  const rootId = useEditorStore(s => s.rootId);
  const nodes = useEditorStore(s => s.nodes);
  const title = useEditorStore(s => s.title);
  const moveNode = useEditorStore(s => s.moveNode);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag, allowing clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (over && active.id !== over.id) {
      const activeNodeId = active.id as string;
      const overNodeId = over.id as string;
      
      const activeNode = nodes[activeNodeId];
      const overNode = nodes[overNodeId];
      
      if (!activeNode || !overNode) return;

      // Determine position
      // Check if we are dropping below or above the target
      // We can infer this from indices if in same parent, or coordinate calculation
      
      let type: 'before' | 'after' = 'after';

      if (activeNode.parentId === overNode.parentId) {
         const parent = nodes[activeNode.parentId!];
         const oldIndex = parent.children.indexOf(activeNodeId);
         const newIndex = parent.children.indexOf(overNodeId);
         type = oldIndex < newIndex ? 'after' : 'before';
      } else {
         // Different parent, rely on geometry
         if (active.rect.current.translated && over.rect) {
            const isBelow = active.rect.current.translated.top > over.rect.top;
            type = isBelow ? 'after' : 'before';
         }
      }

      moveNode(activeNodeId, overNodeId, type);
    }
  };

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
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <SortableContext items={rootNode.children} strategy={verticalListSortingStrategy}>
            {rootNode.children.map(childId => (
              <OutlineNode key={childId} nodeId={childId} depth={0} />
            ))}
          </SortableContext>
        </div>

        {createPortal(
          <DragOverlay>
            {activeId ? (
               <div className="opacity-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded p-2 pointer-events-none">
                 {nodes[activeId]?.content || 'Dragging...'}
               </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

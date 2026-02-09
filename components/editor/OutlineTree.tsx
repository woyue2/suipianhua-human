'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { OutlineNode } from './OutlineNode';
import { IconPicker } from './IconPicker';
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

  const isDescendant = (ancestorId: string, targetId: string): boolean => {
    const ancestor = nodes[ancestorId];
    if (!ancestor) return false;
    const stack = [...ancestor.children];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === targetId) return true;
      const currentNode = nodes[currentId];
      if (currentNode?.children?.length) {
        stack.push(...currentNode.children);
      }
    }
    return false;
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
      if (isDescendant(activeNodeId, overNodeId)) return;

      // Determine position
      // Check if we are dropping below or above the target
      // We can infer this from indices if in same parent, or coordinate calculation
      
      let type: 'before' | 'after' | 'inside' = 'after';
      const overRect = over.rect;
      const translated = active.rect.current.translated;
      const pointerLeft = translated?.left ?? 0;
      const overLeft = overRect?.left ?? 0;
      const isInside = pointerLeft > overLeft + 24;
      if (isInside) {
        type = 'inside';
      }

      if (type !== 'inside' && activeNode.parentId === overNode.parentId) {
         const parent = nodes[activeNode.parentId!];
         const oldIndex = parent.children.indexOf(activeNodeId);
         const newIndex = parent.children.indexOf(overNodeId);
         type = oldIndex < newIndex ? 'after' : 'before';
      } else if (type !== 'inside') {
         // Different parent, rely on geometry
         if (active.rect.current.translated && over.rect) {
            const isBelow = active.rect.current.translated.top > over.rect.top;
            type = isBelow ? 'after' : 'before';
         }
      }

      moveNode(activeNodeId, overNodeId, type);
    }
  };

  const updateNodeIcon = useEditorStore(s => s.updateNodeIcon);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  if (!rootId || !nodes[rootId]) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        暂无内容
      </div>
    );
  }

  const rootNode = nodes[rootId];

  return (
    <div className="
      max-w-2xl lg:max-w-4xl mx-auto
      px-4 py-6 sm:px-6 sm:py-8
      md:px-8 md:py-12
    ">
      <header className="mb-12">
        <h1 className="text-4xl font-bold flex items-center gap-4 group">
          <span 
            ref={iconRef}
            className="text-3xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1 transition-colors select-none"
            onClick={() => setShowIconPicker(true)}
            title="点击修改图标"
          >
            {rootNode.icon || '📚'}
          </span>
          {showIconPicker && (
            <IconPicker 
              onSelect={(icon) => {
                updateNodeIcon(rootId, icon);
                setShowIconPicker(false);
              }}
              onClose={() => setShowIconPicker(false)}
              triggerRef={iconRef}
            />
          )}
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
               <div className="opacity-90 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded px-3 py-2 pointer-events-none">
                 <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                   <span>{nodes[activeId]?.icon || '•'}</span>
                   <span className="truncate max-w-[240px]">
                     {nodes[activeId]?.content || 'Dragging...'}
                   </span>
                 </div>
               </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

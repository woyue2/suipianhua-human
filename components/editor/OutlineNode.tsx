'use client';

import React, { memo, useRef, KeyboardEvent } from 'react';
import { useEditorStore } from '@/lib/store';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);
  const toggleCollapse = useEditorStore(s => s.toggleCollapse);
  const addChildNode = useEditorStore(s => s.addChildNode);
  const addSiblingNode = useEditorStore(s => s.addSiblingNode);
  const deleteNode = useEditorStore(s => s.deleteNode);
  const indentNode = useEditorStore(s => s.indentNode);
  const outdentNode = useEditorStore(s => s.outdentNode);
  const moveNodeUp = useEditorStore(s => s.moveNodeUp);
  const moveNodeDown = useEditorStore(s => s.moveNodeDown);

  const inputRef = useRef<HTMLInputElement>(null);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter - 添加兄弟节点
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const newId = addSiblingNode(nodeId);
      // 延迟聚焦到新节点
      setTimeout(() => {
        const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
        if (newInput) newInput.focus();
      }, 0);
    }
    
    // Ctrl+Enter - 添加子节点
    else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      const newId = addChildNode(nodeId);
      setTimeout(() => {
        const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
        if (newInput) newInput.focus();
      }, 0);
    }
    
    // Tab - 增加缩进
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      indentNode(nodeId);
    }
    
    // Shift+Tab - 减少缩进
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      outdentNode(nodeId);
    }
    
    // Backspace - 删除空节点
    else if (e.key === 'Backspace' && node.content === '') {
      e.preventDefault();
      deleteNode(nodeId);
    }
  };

  const handleAddChild = () => {
    const newId = addChildNode(nodeId);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

  const handleAddSibling = () => {
    const newId = addSiblingNode(nodeId);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

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
      <div className="group flex items-start gap-3 relative hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded px-2 py-1 transition-colors">
        {/* 折叠/展开圆点 */}
        <div 
          onClick={() => hasChildren && toggleCollapse(nodeId)}
          className={getBulletClass()}
        />
        
        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-2 flex-wrap ${textStyle()}`}>
            {node.icon && <span className="mr-1">{node.icon}</span>}
            
            {/* 可编辑输入框 */}
            <input
              ref={inputRef}
              type="text"
              value={node.content}
              onChange={(e) => updateContent(nodeId, e.target.value)}
              onKeyDown={handleKeyDown}
              data-node-id={nodeId}
              placeholder="输入内容..."
              className={`node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0
                ${node.isItalic ? 'italic text-slate-500' : ''}
                ${node.isSubHeader && node.tags?.includes('#重点') ? 'text-primary' : ''}
              `}
            />
            
            {/* 标签 */}
            {node.tags?.map(tag => (
              <span key={tag} className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 操作按钮（悬停显示） */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={handleAddChild}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="添加子节点 (Ctrl+Enter)"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={handleAddSibling}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="添加兄弟节点 (Enter)"
          >
            <Plus size={14} className="rotate-90" />
          </button>
          <button
            onClick={() => indentNode(nodeId)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="增加缩进 (Tab)"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => outdentNode(nodeId)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="减少缩进 (Shift+Tab)"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => moveNodeUp(nodeId)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="上移"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => moveNodeDown(nodeId)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
            title="下移"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => deleteNode(nodeId)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400"
            title="删除 (Backspace on empty)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 递归渲染子节点 */}
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

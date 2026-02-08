'use client';

import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

interface NodeToolbarProps {
  position: { x: number; y: number };
  onAddChild: () => void;
  onAddSibling: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function NodeToolbar({
  position,
  onAddChild,
  onAddSibling,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: NodeToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onAddChild}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="添加子节点 (Ctrl+Enter)"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onAddSibling}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="添加兄弟节点 (Enter)"
      >
        <Plus size={16} className="rotate-90" />
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
      <button
        onClick={onIndent}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="增加缩进 (Tab)"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={onOutdent}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="减少缩进 (Shift+Tab)"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
      <button
        onClick={onMoveUp}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="上移"
      >
        <ChevronUp size={16} />
      </button>
      <button
        onClick={onMoveDown}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="下移"
      >
        <ChevronDown size={16} />
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors"
        title="删除 (Backspace on empty)"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

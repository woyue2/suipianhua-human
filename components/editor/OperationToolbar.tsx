import React, { memo } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface OperationToolbarProps {
  position: { x: number; y: number };
  onAddChild: () => void;
  onAddSibling: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAIReorganize: () => void;
  isAIReorganizing?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * 操作工具栏组件
 * 显示节点的所有操作按钮（添加、移动、删除等）
 */
export const OperationToolbar = memo(function OperationToolbar({
  position,
  onAddChild,
  onAddSibling,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAIReorganize,
  isAIReorganizing = false,
  onMouseEnter,
  onMouseLeave,
}: OperationToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => {
        onMouseEnter();
      }}
      onMouseLeave={(e) => {
        // 检查鼠标是否真的离开了工具栏区域
        const rect = e.currentTarget.getBoundingClientRect();
        const buffer = 10; // 10px 缓冲区
        
        if (
          e.clientX < rect.left - buffer ||
          e.clientX > rect.right + buffer ||
          e.clientY < rect.top - buffer ||
          e.clientY > rect.bottom + buffer
        ) {
          onMouseLeave();
        }
      }}
    >
      {/* AI 整理 */}
      <button
        onClick={onAIReorganize}
        disabled={isAIReorganizing}
        className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors ${
          isAIReorganizing ? 'text-purple-400 animate-pulse cursor-wait' : 'text-purple-600 dark:text-purple-400'
        }`}
        title="AI 智能整理"
      >
        <Sparkles size={16} />
      </button>

      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />

      {/* 添加节点 */}
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

      {/* 缩进控制 */}
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

      {/* 移动节点 */}
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

      {/* 删除节点 */}
      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors"
        title="删除 (Backspace on empty)"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});


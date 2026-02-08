import React, { memo } from 'react';
import { Bold, Italic, Underline, Highlighter } from 'lucide-react';

interface FormatToolbarProps {
  position: { x: number; y: number };
  onApplyFormat: (format: 'bold' | 'italic' | 'underline' | 'highlight') => void;
}

/**
 * 格式化工具栏组件
 * 显示文本格式化按钮（粗体、斜体、下划线、高亮）
 */
export const FormatToolbar = memo(function FormatToolbar({
  position,
  onApplyFormat,
}: FormatToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onMouseDown={e => e.preventDefault()} // 防止失去焦点
    >
      <button
        onClick={() => onApplyFormat('bold')}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="粗体 (**text**)"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => onApplyFormat('italic')}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="斜体 (*text*)"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => onApplyFormat('underline')}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="下划线 (<u>text</u>)"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => onApplyFormat('highlight')}
        className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400 transition-colors"
        title="荧光笔 (==text==)"
      >
        <Highlighter size={16} />
      </button>
    </div>
  );
});

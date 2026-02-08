'use client';

import React from 'react';
import { Bold, Italic, Underline, Highlighter } from 'lucide-react';

interface FormatToolbarProps {
  position: { x: number; y: number };
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onHighlight: () => void;
}

export function FormatToolbar({
  position,
  onBold,
  onItalic,
  onUnderline,
  onHighlight,
}: FormatToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={onBold}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="粗体"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={onItalic}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="斜体"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={onUnderline}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
        title="下划线"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={onHighlight}
        className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400 transition-colors"
        title="荧光笔"
      >
        <Highlighter size={16} />
      </button>
    </div>
  );
}

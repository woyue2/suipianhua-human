'use client';

import React from 'react';

interface UnifiedToolbarProps {
  type: 'operation' | 'format';
  position: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}

/**
 * 统一工具栏组件 - 操作工具栏和格式工具栏使用相同的逻辑
 */
export function UnifiedToolbar({ 
  type, 
  position, 
  onMouseEnter, 
  onMouseLeave, 
  children 
}: UnifiedToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
      style={{
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-toolbar-type={type}
    >
      {children}
    </div>
  );
}

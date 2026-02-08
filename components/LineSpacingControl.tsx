'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/store';

export function LineSpacingControl() {
  const lineSpacing = useEditorStore(s => s.lineSpacing);
  const setLineSpacing = useEditorStore(s => s.setLineSpacing);
  const [isOpen, setIsOpen] = useState(false);

  const spacingOptions = [
    { value: 'compact', label: '紧凑', icon: '≡', description: '1.2x' },
    { value: 'normal', label: '正常', icon: '☰', description: '1.6x' },
    { value: 'relaxed', label: '舒适', icon: '≣', description: '2.0x' },
    { value: 'loose', label: '宽松', icon: '≣', description: '2.5x' },
  ] as const;

  const currentOption = spacingOptions.find(opt => opt.value === lineSpacing) || spacingOptions[1];

  return (
    <div className="relative">
      {/* 触发按钮 - 与 Header 其他按钮样式一致 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all"
        title="调整行间距"
      >
        <span className="text-base">{currentOption.icon}</span>
        <span className="text-xs">{currentOption.label}</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              行间距设置
            </div>
            
            {spacingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setLineSpacing(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  lineSpacing === option.value ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-6">{option.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {lineSpacing === option.value && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

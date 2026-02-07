'use client';

import React from 'react';
import { Folder, Maximize2, PlayCircle, Type } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-background-dark z-10">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 overflow-hidden">
        <Folder size={14} />
        <span className="whitespace-nowrap hover:underline cursor-pointer">我的文档</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="truncate">📚 读书笔记《我们如何学习》</span>
      </div>
      
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
        <button className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all">
          <Maximize2 size={16} />
        </button>
        <button className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all">
          <PlayCircle size={16} />
        </button>
        <button className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all">
          <Type size={16} />
        </button>
      </div>
    </header>
  );
};


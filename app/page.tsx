'use client';

import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from '@/components/editor/Sidebar';
import { Header } from '@/components/editor/Header';
import { OutlineTree } from '@/components/editor/OutlineTree';
import { useEditorStore } from '@/lib/store';
import { INITIAL_NODES, INITIAL_SIDEBAR_DATA } from '@/lib/constants';

export default function Home() {
  const isDarkMode = useEditorStore(s => s.isDarkMode);
  const toggleDarkMode = useEditorStore(s => s.toggleDarkMode);
  const initializeWithData = useEditorStore(s => s.initializeWithData);

  // 初始化数据
  useEffect(() => {
    initializeWithData(INITIAL_NODES, 'root', '读书笔记《我们如何学习》');
  }, [initializeWithData]);

  // 处理暗黑模式
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-background-dark text-slate-800 dark:text-slate-200">
      <Sidebar items={INITIAL_SIDEBAR_DATA} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <OutlineTree />
        </div>
      </main>

      <button 
        onClick={toggleDarkMode}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95 z-50"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}


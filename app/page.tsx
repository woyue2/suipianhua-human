'use client';

import { useEffect, useState, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from '@/components/editor/Sidebar';
import { Header } from '@/components/editor/Header';
import { OutlineTree } from '@/components/editor/OutlineTree';
import { useEditorStore } from '@/lib/store';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const isDarkMode = useEditorStore(s => s.isDarkMode);
  const toggleDarkMode = useEditorStore(s => s.toggleDarkMode);
  const fetchDocuments = useEditorStore(s => s.fetchDocuments);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const canUndo = useEditorStore(s => s.canUndo);
  const canRedo = useEditorStore(s => s.canRedo);
  const saveDocument = useEditorStore(s => s.saveDocument);
  const autoSaveEnabled = useEditorStore(s => s.autoSaveEnabled);
  const lastEditedAt = useEditorStore(s => s.lastEditedAt);
  const lastSavedAt = useEditorStore(s => s.lastSavedAt);
  const saveStatus = useEditorStore(s => s.saveStatus);
  const autoSaveNow = useEditorStore(s => s.autoSaveNow);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // 初始化数据
  useEffect(() => {
    const initApp = async () => {
      if (isInitialized) return;
      
      console.log('🚀 Initializing app...');
      
      // 先加载文档列表
      await fetchDocuments();
      
      setIsInitialized(true);
    };
    
    initApp();
  }, [fetchDocuments, isInitialized]);

  // 处理暗黑模式
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('🌙 Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('☀️ Light mode enabled');
    }
  }, [isDarkMode]);

  // 全局快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中（输入框内的快捷键由组件自己处理）
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Z - 撤销
        if (e.key === 'z' && !e.shiftKey && !isInput) {
          e.preventDefault();
          if (canUndo) {
            console.log('⌨️ Keyboard shortcut: Undo');
            undo();
          }
        } 
        // Ctrl+Y 或 Ctrl+Shift+Z - 重做
        else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !isInput) {
          e.preventDefault();
          if (canRedo) {
            console.log('⌨️ Keyboard shortcut: Redo');
            redo();
          }
        }
        // Ctrl+S - 保存
        else if (e.key === 's') {
          e.preventDefault();
          console.log('⌨️ Keyboard shortcut: Save');
          saveDocument();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, saveDocument]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (!lastEditedAt) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveNow();
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autoSaveEnabled, lastEditedAt, lastSavedAt, saveStatus, autoSaveNow]);

  const handleDarkModeToggle = () => {
    console.log('🌓 Dark mode toggle clicked');
    toggleDarkMode();
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-white dark:bg-background-dark text-slate-800 dark:text-slate-200"
      onTouchStart={(e) => {
        const x = e.touches[0]?.clientX ?? 0;
        setTouchStartX(x);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX ?? 0;
        if (touchStartX !== null) {
          const deltaX = endX - touchStartX;
          if (isMobile && isSidebarCollapsed && touchStartX < 24 && deltaX > 30) {
            setIsSidebarCollapsed(false);
          }
        }
        setTouchStartX(null);
      }}
    >
      {/* 移动端遮罩层：侧边栏展开时显示，用于点击关闭 */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onTouchStart={(e) => {
            const x = e.touches[0]?.clientX ?? 0;
            setTouchStartX(x);
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches[0]?.clientX ?? 0;
            if (touchStartX !== null) {
              const deltaX = touchStartX - endX;
              if (deltaX > 30) {
                setIsSidebarCollapsed(true);
              }
            }
            setTouchStartX(null);
          }}
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          // 移动端：通过 Header 左侧汉堡按钮控制侧边栏
          // 桌面端：可忽略
          toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        />
        
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <OutlineTree />
        </div>
      </main>


      <button 
        onClick={handleDarkModeToggle}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95 z-50"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, FileText, 
  Trash2, LayoutTemplate, X, Edit2, RotateCcw, ChevronLeft 
} from 'lucide-react';
import { SidebarItem } from '@/types';
import { useEditorStore } from '@/lib/store';

interface SidebarProps {
  items: SidebarItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isCollapsed, onToggleCollapse }) => {
  // 所有 hooks 必须在任何条件返回之前调用
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState(items);
  const [activeItemId, setActiveItemId] = useState(items.find(i => i.isActive)?.id || items[0]?.id);
  const [appName, setAppName] = useState('爱学习幕小布');
  const [isEditingName, setIsEditingName] = useState(false);
  const [trashedItems, setTrashedItems] = useState<SidebarItem[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  
  const initializeWithData = useEditorStore(s => s.initializeWithData);
  const nodes = useEditorStore(s => s.nodes);
  const rootId = useEditorStore(s => s.rootId);

  // 搜索过滤
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return localItems;
    
    const query = searchQuery.toLowerCase();
    return localItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }, [localItems, searchQuery]);

  // 新建文档
  const handleCreateDocument = () => {
    const newId = crypto.randomUUID();
    
    const newItem: SidebarItem = {
      id: newId,
      title: '新建文档',
      emoji: '📄',
      isActive: false,
    };

    setLocalItems(prev => [newItem, ...prev]);
    console.log('📄 Created new document:', newItem.title);
  };

  // 切换文档
  const handleSelectDocument = (itemId: string) => {
    setActiveItemId(itemId);
    setLocalItems(prev => prev.map(item => ({
      ...item,
      isActive: item.id === itemId
    })));
    
    const selectedItem = localItems.find(i => i.id === itemId);
    console.log('📂 Switched to document:', selectedItem?.title);
  };

  // 删除文档（移到回收站）
  const handleDeleteDocument = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = localItems.find(i => i.id === itemId);
    if (!item) return;
    
    setTrashedItems(prev => [...prev, { ...item, isActive: false }]);
    setLocalItems(prev => prev.filter(i => i.id !== itemId));
    
    if (itemId === activeItemId && localItems.length > 1) {
      const remainingItems = localItems.filter(i => i.id !== itemId);
      if (remainingItems.length > 0) {
        handleSelectDocument(remainingItems[0].id);
      }
    }
    
    console.log('🗑️ Moved to trash:', item.title);
  };

  // 从回收站恢复
  const handleRestoreDocument = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = trashedItems.find(i => i.id === itemId);
    if (!item) return;
    
    setLocalItems(prev => [...prev, item]);
    setTrashedItems(prev => prev.filter(i => i.id !== itemId));
    
    console.log('♻️ Restored from trash:', item.title);
  };

  // 永久删除
  const handlePermanentDelete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = trashedItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (confirm(`确定要永久删除文档"${item.title}"吗？此操作无法撤销！`)) {
      setTrashedItems(prev => prev.filter(i => i.id !== itemId));
      console.log('❌ Permanently deleted:', item.title);
    }
  };

  // 清空回收站
  const handleEmptyTrash = () => {
    if (trashedItems.length === 0) return;
    
    if (confirm(`确定要清空回收站吗？这将永久删除 ${trashedItems.length} 个文档，此操作无法撤销！`)) {
      setTrashedItems([]);
      console.log('🗑️ Trash emptied');
    }
  };

  // 编辑应用名称
  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingName(false);
      console.log('✏️ App name updated:', appName);
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  // 如果折叠，只显示展开按钮（所有 hooks 已经调用完毕，可以安全返回）
  if (isCollapsed) {
    return (
      <>
        <button
          onClick={onToggleCollapse}
          className="fixed left-2 top-4 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-50 shadow-lg"
          title="展开侧边栏"
        >
          <ChevronLeft size={20} className="rotate-180" />
        </button>
        <div className="w-0 h-full shrink-0"></div>
      </>
    );
  }

  // 正常渲染侧边栏
  return (
    <>
      <button
        onClick={onToggleCollapse}
        className="fixed left-60 top-4 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-50 shadow-lg"
        title="折叠侧边栏"
      >
        <ChevronLeft size={16} />
      </button>

      <aside className="w-64 h-full bg-sidebar-light dark:bg-sidebar-dark border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group flex-1 min-w-0">
            <div className="w-6 h-6 bg-slate-800 dark:bg-white rounded flex items-center justify-center flex-shrink-0">
              <LayoutTemplate size={14} className="text-white dark:text-slate-800" />
            </div>
            {isEditingName ? (
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                onKeyDown={handleNameSave}
                onBlur={() => setIsEditingName(false)}
                autoFocus
                className="font-semibold text-sm bg-transparent border-b border-primary outline-none flex-1 min-w-0"
              />
            ) : (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="font-semibold text-sm truncate">{appName}</span>
                <button
                  onClick={handleNameEdit}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
                  title="编辑名称"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-200/50 dark:bg-slate-800 border-none rounded-md py-1.5 pl-8 pr-7 text-sm focus:ring-1 focus:ring-primary outline-none" 
              placeholder="搜索文档" 
              type="text" 
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={handleCreateDocument}
            className="bg-slate-800 dark:bg-slate-700 text-white rounded-md p-1.5 flex items-center justify-center hover:bg-slate-900 transition-colors"
            title="新建文档"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 text-[13px]">
          {!showTrash ? (
            <>
              <div className="px-2 py-2 mb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                所有文档 ({filteredItems.length})
              </div>
              
              {filteredItems.length === 0 ? (
                <div className="px-3 py-8 text-center text-slate-400 text-xs">
                  {searchQuery ? '未找到匹配的文档' : '暂无文档'}
                </div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectDocument(item.id)}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
                      ${item.id === activeItemId
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-primary font-medium' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex-shrink-0">
                      {item.emoji ? (
                        <span className="text-base">{item.emoji}</span>
                      ) : (
                        <FileText size={16} className={item.id === activeItemId ? 'text-primary' : 'text-slate-400'} />
                      )}
                    </div>
                    <span className="truncate flex-1">{item.title}</span>
                    
                    <button
                      onClick={(e) => handleDeleteDocument(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-opacity"
                      title="移到回收站"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div className="px-2 py-2 mb-1 flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  回收站 ({trashedItems.length})
                </div>
                {trashedItems.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    清空
                  </button>
                )}
              </div>
              
              {trashedItems.length === 0 ? (
                <div className="px-3 py-8 text-center text-slate-400 text-xs">
                  回收站为空
                </div>
              ) : (
                trashedItems.map(item => (
                  <div 
                    key={item.id}
                    className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex-shrink-0 opacity-50">
                      {item.emoji ? (
                        <span className="text-base">{item.emoji}</span>
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                    <span className="truncate flex-1 line-through opacity-70">{item.title}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={(e) => handleRestoreDocument(item.id, e)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-opacity"
                        title="恢复"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        onClick={(e) => handlePermanentDelete(item.id, e)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-opacity"
                        title="永久删除"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          <div className="pt-4 space-y-0.5 border-t border-slate-200 dark:border-slate-800 mt-4">
            <div 
              onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors
                ${showTrash ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}
              title={showTrash ? '返回文档列表' : '查看回收站'}
            >
              <Trash2 size={16} />
              <span>回收站</span>
              <span className="ml-auto text-xs text-slate-400">({trashedItems.length})</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

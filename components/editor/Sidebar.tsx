'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, FileText,
  Trash2, LayoutTemplate, X, Edit2, RotateCcw, ChevronLeft
} from 'lucide-react';
import { SidebarItem } from '@/types';
import { useEditorStore } from '@/lib/store';
import { documentDb } from '@/lib/db';
import { supabaseDocumentDb } from '@/lib/supabase-db';
import { useAuth } from '@/app/auth/AuthProvider';
import { toast } from 'sonner';

interface SidebarProps {
  items: SidebarItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isCollapsed, onToggleCollapse }) => {
  // 所有 hooks 必须在任何条件返回之前调用
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<SidebarItem[]>([]);
  const [activeItemId, setActiveItemId] = useState('');
  const [appName, setAppName] = useState('改变思维，身体进步，是财富是永恒');
  const [isEditingName, setIsEditingName] = useState(false);
  const [trashedItems, setTrashedItems] = useState<SidebarItem[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const initializeWithData = useEditorStore(s => s.initializeWithData);
  const loadDocument = useEditorStore(s => s.loadDocument);
  const saveDocument = useEditorStore(s => s.saveDocument);
  const documents = useEditorStore(s => s.documents);
  const fetchDocuments = useEditorStore(s => s.fetchDocuments);
  const { user } = useAuth();

  // ✅ 从 IndexedDB 加载文档列表
  useEffect(() => {
    const loadDocumentList = async () => {
      setIsLoading(true);
      await fetchDocuments();
      setIsLoading(false);
    };
    loadDocumentList();
  }, [fetchDocuments]);

  // ✅ 将 store 中的 documents 转换为 SidebarItem 格式
  useEffect(() => {
    const items: SidebarItem[] = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      emoji: '📄',
      isActive: false,
    }));
    setLocalItems(items);
    
    // 如果还没有选中的文档且有文档列表，自动选中第一个
    if (!activeItemId && items.length > 0) {
      setActiveItemId(items[0].id);
      handleSelectDocument(items[0].id);
    }
  }, [documents]);

  // 搜索过滤
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return localItems;
    
    const query = searchQuery.toLowerCase();
    return localItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }, [localItems, searchQuery]);

  // 新建文档
  const handleCreateDocument = async () => {
    const newId = crypto.randomUUID();
    const rootNodeId = crypto.randomUUID();
    const firstChildId = crypto.randomUUID();
    const now = Date.now();
    
    // 创建新文档的初始节点结构（包含根节点和第一个可编辑的子节点）
    const initialNodes = {
      [rootNodeId]: {
        id: rootNodeId,
        parentId: null,
        content: '',
        level: 0,
        children: [firstChildId],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      [firstChildId]: {
        id: firstChildId,
        parentId: rootNodeId,
        content: '',
        level: 1,
        children: [],
        images: [],
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      }
    };
    
    // 初始化新文档的数据结构
    initializeWithData(initialNodes, rootNodeId, '新建文档');
    
    // 保存到 IndexedDB
    try {
      await saveDocument();
      console.log('✅ New document saved to IndexedDB');
      
      // 重新加载文档列表
      await fetchDocuments();
      
      // 自动切换到新文档
      setActiveItemId(newId);
      
      console.log('📄 Created new document with first editable node: 新建文档');
    } catch (error) {
      console.error('❌ Failed to save new document:', error);
      toast.error('创建文档失败');
    }
  };

  // 切换文档 - ✅ 修复：从 IndexedDB 加载文档数据
  const handleSelectDocument = async (itemId: string) => {
    // 如果当前有正在编辑的文档，先保存当前文档
    if (activeItemId && activeItemId !== itemId) {
      await saveDocument();
      console.log('💾 Auto-saved current document before switching');
    }

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const document = (url && key && user?.id)
        ? await supabaseDocumentDb.loadDocument(itemId)
        : await documentDb.loadDocument(itemId);
      
      if (!document) {
        toast.error('文档加载失败：未找到文档');
        console.error('❌ Document not found:', itemId);
        return;
      }

      // 加载文档到编辑器
      loadDocument(document);
      
      // 更新 UI 状态
      setActiveItemId(itemId);
      setLocalItems(prev => prev.map(item => ({
        ...item,
        isActive: item.id === itemId
      })));
      
      console.log('✅ Loaded document:', document.title);
    } catch (error) {
      console.error('❌ Failed to load document:', error);
      toast.error('文档加载失败');
    }
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
  const handlePermanentDelete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const item = trashedItems.find(i => i.id === itemId);
    if (!item) return;

    toast(`确定要永久删除文档"${item.title}"吗？此操作无法撤销！`, {
      action: {
        label: '删除',
        onClick: async () => {
          try {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (url && key && user?.id) {
              await supabaseDocumentDb.deleteDocument(itemId, user.id);
              await fetchDocuments();
            } else {
              await documentDb.deleteDocument(itemId);
            }
            setTrashedItems(prev => prev.filter(i => i.id !== itemId));
            console.log('❌ Permanently deleted:', item.title);
            toast.success('文档已永久删除');
          } catch (error) {
            console.error('❌ Failed to delete document:', error);
            toast.error('删除失败');
          }
        },
      },
      cancel: {
        label: '取消',
        onClick: () => {},
      },
    });
  };

  // 清空回收站
  const handleEmptyTrash = () => {
    if (trashedItems.length === 0) return;

    toast(`确定要清空回收站吗？这将永久删除 ${trashedItems.length} 个文档，此操作无法撤销！`, {
      action: {
        label: '清空',
        onClick: async () => {
          try {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (url && key && user?.id) {
              await supabaseDocumentDb.deleteDocuments(
                trashedItems.map(item => item.id),
                user.id
              );
              await fetchDocuments();
            } else {
              await Promise.all(
                trashedItems.map(item => documentDb.deleteDocument(item.id))
              );
            }
            setTrashedItems([]);
            console.log('🗑️ Trash emptied');
            toast.success('回收站已清空（已永久删除）');
          } catch (error) {
            console.error('❌ Failed to empty trash:', error);
            toast.error('清空失败');
          }
        },
      },
      cancel: {
        label: '取消',
        onClick: () => {},
      },
    });
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
              
              {isLoading ? (
                <div className="px-3 py-8 text-center text-slate-400 text-xs">
                  加载中...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="px-3 py-8 text-center text-slate-400 text-xs">
                  {searchQuery ? '未找到匹配的文档' : '暂无文档，点击 + 创建新文档'}
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
                  回收站为空（无可删除文档）
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

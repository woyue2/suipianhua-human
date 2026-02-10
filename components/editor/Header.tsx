'use client';

import React, { useState } from 'react';
import { Folder, Save, Upload, Download, Sparkles, Settings, Menu, FileJson, FileCode, CheckSquare } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { AIReorganizeModal } from '@/components/ai/AIReorganizeModal';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { LineSpacingControl } from '@/components/LineSpacingControl';
import { toastExportError, toastExportSuccess, toastImportError, toastImportSuccess } from '@/lib/toast';
import { Document, OutlineNode, ImageAttachment } from '@/types';
import { LINE_SPACING_CONFIG, LineSpacingType } from '@/lib/constants';
import { generateHTML } from '@/lib/export-html';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeImageAttachment = (image: unknown, now: number): ImageAttachment | null => {
  if (!isRecord(image)) return null;
  const url = typeof image.url === 'string' ? image.url : '';
  if (!url) return null;
  return {
    id: typeof image.id === 'string' ? image.id : crypto.randomUUID(),
    url,
    thumbnail: typeof image.thumbnail === 'string' ? image.thumbnail : undefined,
    width: typeof image.width === 'number' ? image.width : 0,
    height: typeof image.height === 'number' ? image.height : 0,
    alt: typeof image.alt === 'string' ? image.alt : undefined,
    caption: typeof image.caption === 'string' ? image.caption : undefined,
    uploadedAt: typeof image.uploadedAt === 'number' ? image.uploadedAt : now,
  };
};

const isLineSpacing = (value: unknown): value is LineSpacingType =>
  typeof value === 'string' && value in LINE_SPACING_CONFIG;

const normalizeOutlineNode = (
  node: unknown,
  parentId: string | null,
  level: number,
  now: number,
  usedIds: Set<string>
): OutlineNode => {
  const nodeRecord = isRecord(node) ? node : {};
  const preferredId = typeof nodeRecord.id === 'string' ? nodeRecord.id : crypto.randomUUID();
  const nodeId = usedIds.has(preferredId) ? crypto.randomUUID() : preferredId;
  usedIds.add(nodeId);
  const rawChildren = Array.isArray(nodeRecord.children) ? nodeRecord.children : [];
  const children = rawChildren
    .filter(child => child && typeof child === 'object')
    .map(child => normalizeOutlineNode(child, nodeId, level + 1, now, usedIds));
  const rawImages = Array.isArray(nodeRecord.images) ? nodeRecord.images : [];
  const images = rawImages
    .map(img => normalizeImageAttachment(img, now))
    .filter((img): img is ImageAttachment => Boolean(img));
  const rawTags = Array.isArray(nodeRecord.tags) ? nodeRecord.tags : undefined;
  return {
    id: nodeId,
    parentId,
    content: typeof nodeRecord.content === 'string' ? nodeRecord.content : '',
    level,
    images,
    collapsed: Boolean(nodeRecord.collapsed),
    createdAt: typeof nodeRecord.createdAt === 'number' ? nodeRecord.createdAt : now,
    updatedAt: typeof nodeRecord.updatedAt === 'number' ? nodeRecord.updatedAt : now,
    isHeader: typeof nodeRecord.isHeader === 'boolean' ? nodeRecord.isHeader : undefined,
    isSubHeader: typeof nodeRecord.isSubHeader === 'boolean' ? nodeRecord.isSubHeader : undefined,
    tags: rawTags?.filter((tag): tag is string => typeof tag === 'string'),
    isItalic: typeof nodeRecord.isItalic === 'boolean' ? nodeRecord.isItalic : undefined,
    icon: typeof nodeRecord.icon === 'string' ? nodeRecord.icon : undefined,
    children,
  };
};

const normalizeImportedDocument = (data: unknown): { doc: Document; settings?: { lineSpacing?: LineSpacingType; autoSaveEnabled?: boolean; isDarkMode?: boolean } } => {
  if (!isRecord(data)) {
    throw new Error('导入失败，文件格式不正确');
  }
  const settings = isRecord(data.settings) ? data.settings : null;
  const normalizedSettings = settings
    ? {
        lineSpacing: isLineSpacing(settings.lineSpacing) ? settings.lineSpacing : undefined,
        autoSaveEnabled: typeof settings.autoSaveEnabled === 'boolean' ? settings.autoSaveEnabled : undefined,
        isDarkMode: typeof settings.isDarkMode === 'boolean' ? settings.isDarkMode : undefined,
      }
    : undefined;
  const source = isRecord(data.document) ? data.document : data;
  const now = Date.now();
  const rootSource = isRecord(source.root) ? source.root : null;
  if (!rootSource) {
    throw new Error('导入失败，缺少根节点');
  }
  const root = normalizeOutlineNode(rootSource, null, 0, now, new Set());
  const title =
    typeof source.title === 'string' && source.title.trim() ? source.title.trim() : '未命名';
  return {
    settings: normalizedSettings,
    doc: {
    id: crypto.randomUUID(),
    title,
    root,
    metadata: {
        createdAt: isRecord(source.metadata) && typeof source.metadata.createdAt === 'number'
          ? source.metadata.createdAt
          : now,
        updatedAt: now,
        version:
          isRecord(source.metadata) && typeof source.metadata.version === 'string'
            ? source.metadata.version
            : '1.0.0',
        deletedAt:
          isRecord(source.metadata) && typeof source.metadata.deletedAt === 'number'
            ? source.metadata.deletedAt
            : null,
      },
    },
  };
};

const countNodes = (node: OutlineNode): number =>
  1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);

export const Header = React.memo(({ toggleSidebar }: HeaderProps) => {
  const saveDocument = useEditorStore(s => s.saveDocument);
  const saveStatus = useEditorStore(s => s.saveStatus);
  const buildDocumentTree = useEditorStore(s => s.buildDocumentTree);
  const loadDocument = useEditorStore(s => s.loadDocument);
  const title = useEditorStore(s => s.title);
  const setTitle = useEditorStore(s => s.setTitle);
  const fetchDocuments = useEditorStore(s => s.fetchDocuments);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const canUndo = useEditorStore(s => s.canUndo);
  const canRedo = useEditorStore(s => s.canRedo);
  const lineSpacing = useEditorStore(s => s.lineSpacing);
  const setLineSpacing = useEditorStore(s => s.setLineSpacing);
  const autoSaveEnabled = useEditorStore(s => s.autoSaveEnabled);
  const setAutoSaveEnabled = useEditorStore(s => s.setAutoSaveEnabled);
  const isDarkMode = useEditorStore(s => s.isDarkMode);
  const toggleDarkMode = useEditorStore(s => s.toggleDarkMode);
  
  const isSelectionMode = useEditorStore(s => s.isSelectionMode);
  const toggleSelectionMode = useEditorStore(s => s.toggleSelectionMode);
  const selectedNodeIds = useEditorStore(s => s.selectedNodeIds);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const showAIModal = useEditorStore(s => s.showAIModal);
  const setShowAIModal = useEditorStore(s => s.setShowAIModal);
  const showSettings = useEditorStore(s => s.showSettings);
  const setShowSettings = useEditorStore(s => s.setShowSettings);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSave = async () => {
    console.log('💾 Save button clicked');
    try {
      await saveDocument();
      console.log('✅ Save completed');
    } catch (error) {
      console.error('❌ Save failed:', error);
    }
  };

  const handleExport = (exportType: 'json' | 'html' = 'json') => {
    console.log(`📤 Export button clicked (${exportType})`);
    try {
      const doc = buildDocumentTree();
      
      if (exportType === 'html') {
        const html = generateHTML(doc);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title || 'outline'}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const payload = {
          ...doc,
          settings: {
            lineSpacing,
            autoSaveEnabled,
            isDarkMode,
          },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title || 'outline'}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      console.log('✅ Export completed');
      toastExportSuccess();
      setShowExportMenu(false);
    } catch (error) {
      console.error('❌ Export error:', error);
      toastExportError();
    }
  };

  const handleImport = () => {
    console.log('📥 Import button clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        console.log('📄 Reading file:', file.name);
        const text = await file.text();
        const raw = JSON.parse(text);
        const { doc, settings } = normalizeImportedDocument(raw);
        const nodeCount = countNodes(doc.root);
        const confirmed = window.confirm(`即将导入文档「${doc.title}」，共 ${nodeCount} 个节点。当前内容将被覆盖，是否继续？`);
        if (!confirmed) return;
        if (settings?.lineSpacing) {
          setLineSpacing(settings.lineSpacing);
        }
        if (typeof settings?.autoSaveEnabled === 'boolean') {
          setAutoSaveEnabled(settings.autoSaveEnabled);
        }
        if (typeof settings?.isDarkMode === 'boolean' && settings.isDarkMode !== isDarkMode) {
          toggleDarkMode();
        }
        loadDocument(doc);
        await saveDocument();
        await fetchDocuments();
        toastImportSuccess();
        console.log('✅ Import completed');
      } catch (error) {
        console.error('❌ Import error:', error);
        const message = error instanceof Error ? error.message : undefined;
        toastImportError(message);
      }
    };
    input.click();
  };

  const handleUndo = () => {
    console.log('↶ Undo button clicked');
    undo();
  };

  const handleRedo = () => {
    console.log('↷ Redo button clicked');
    redo();
  };

  const handleAIClick = () => {
    console.log('✨ AI button clicked');
    setShowAIModal(true);
  };

  const handleSettingsClick = () => {
    console.log('⚙️ Settings button clicked');
    setShowSettings(true);
  };

  const getSaveIcon = () => {
    if (saveStatus === 'saving') return '⏳';
    if (saveStatus === 'saved') return '✓';
    if (saveStatus === 'error') return '✗';
    return null;
  };

  const commitTitle = async () => {
    const nextTitle = titleDraft.trim() || '未命名';
    if (nextTitle === title) {
      setIsEditingTitle(false);
      return;
    }
    setTitle(nextTitle);
    setIsEditingTitle(false);
    await saveDocument();
    await fetchDocuments();
  };

  return (
    <>
      <header className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-background-dark z-10">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 overflow-hidden">
          {/* 移动端汉堡菜单：控制侧边栏 */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 mr-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            title="侧边栏"
          >
            <Menu size={18} />
          </button>
          <Folder size={14} className="hidden lg:inline" />
          <span className="whitespace-nowrap hover:underline cursor-pointer hidden lg:inline">我的文档</span>
          <span className="text-slate-300 dark:text-slate-700 hidden lg:inline">|</span>
          {isEditingTitle ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              className="truncate bg-transparent border-b border-primary outline-none min-w-0"
            />
          ) : (
            <button
              type="button"
              className="truncate text-left"
              onClick={() => {
                setTitleDraft(title);
                setIsEditingTitle(true);
              }}
              title="点击重命名"
            >
              {title || '未命名'}
            </button>
          )}
        </div>
        
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
          {/* 保存按钮 */}
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
            title="保存 (Ctrl+S)"
          >
            <Save size={16} />
            {getSaveIcon() && <span className="text-xs">{getSaveIcon()}</span>}
          </button>

          {/* 撤销/重做 */}
          <button 
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all disabled:opacity-30"
            title="撤销 (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all disabled:opacity-30"
            title="重做 (Ctrl+Y)"
          >
            ↷
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* 导入/导出 */}
          <button 
            onClick={handleImport}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all"
            title="导入"
          >
            <Upload size={16} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all"
              title="导出"
            >
              <Download size={16} />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    导出选项
                  </div>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    <FileJson size={18} />
                    <div className="text-left">
                      <div className="text-sm font-medium">导出 JSON</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">备份与恢复</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    <FileCode size={18} />
                    <div className="text-left">
                      <div className="text-sm font-medium">导出 HTML</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">单页网页格式</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* 多选模式 */}
          <button 
            onClick={toggleSelectionMode}
            className={`p-1 px-2 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm flex items-center gap-1 transition-all ${
              isSelectionMode 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                : 'text-slate-600 dark:text-slate-400'
            }`}
            title="多选模式"
          >
            <CheckSquare size={16} />
            {selectedNodeIds.length > 0 && <span className="text-xs font-bold">{selectedNodeIds.length}</span>}
          </button>

          {/* AI 重组 */}
          <button 
            onClick={handleAIClick}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-primary rounded shadow-sm flex items-center gap-1 transition-all"
            title="AI 智能重组"
          >
            <Sparkles size={16} />
          </button>

          {/* 行间距控制 */}
          <LineSpacingControl />

          {/* 设置 */}
          <button 
            onClick={handleSettingsClick}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all"
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* AI 重组弹窗 */}
      {showAIModal && (
        <AIReorganizeModal onClose={() => setShowAIModal(false)} />
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
});

Header.displayName = 'Header';

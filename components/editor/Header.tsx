'use client';

import React, { useState } from 'react';
import { Folder, Save, Upload, Download, Sparkles, Settings } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { AIReorganizeModal } from '@/components/ai/AIReorganizeModal';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { LineSpacingControl } from '@/components/LineSpacingControl';
import { toastExportError, toastImportError } from '@/lib/toast';

export const Header: React.FC = () => {
  const saveDocument = useEditorStore(s => s.saveDocument);
  const saveStatus = useEditorStore(s => s.saveStatus);
  const buildDocumentTree = useEditorStore(s => s.buildDocumentTree);
  const loadDocument = useEditorStore(s => s.loadDocument);
  const title = useEditorStore(s => s.title);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const canUndo = useEditorStore(s => s.canUndo);
  const canRedo = useEditorStore(s => s.canRedo);

  const [showAIModal, setShowAIModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = async () => {
    console.log('💾 Save button clicked');
    try {
      await saveDocument();
      console.log('✅ Save completed');
    } catch (error) {
      console.error('❌ Save failed:', error);
    }
  };

  const handleExport = () => {
    console.log('📤 Export button clicked');
    try {
      const doc = buildDocumentTree();
      const blob = new Blob([JSON.stringify(doc, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'outline'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ Export completed');
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
        const doc = JSON.parse(text);
        loadDocument(doc);
        console.log('✅ Import completed');
      } catch (error) {
        console.error('❌ Import error:', error);
        toastImportError();
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

  return (
    <>
      <header className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-background-dark z-10">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 overflow-hidden">
          <Folder size={14} />
          <span className="whitespace-nowrap hover:underline cursor-pointer">我的文档</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="truncate">{title}</span>
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
          <button 
            onClick={handleExport}
            className="p-1 px-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm flex items-center gap-1 transition-all"
            title="导出"
          >
            <Download size={16} />
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

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
};

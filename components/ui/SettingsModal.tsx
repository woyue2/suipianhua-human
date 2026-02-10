'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import PromptSettings from '@/components/settings/PromptSettings';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = React.memo<SettingsModalProps>(({ onClose }) => {
  const autoSaveEnabled = useEditorStore(s => s.autoSaveEnabled);
  const setAutoSaveEnabled = useEditorStore(s => s.setAutoSaveEnabled);
  const isDarkMode = useEditorStore(s => s.isDarkMode);
  const toggleDarkMode = useEditorStore(s => s.toggleDarkMode);

  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled);
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode);
  const [activePromptId, setActivePromptId] = useState('reorganize-default');

  useEffect(() => {
    setLocalAutoSave(autoSaveEnabled);
    setLocalDarkMode(isDarkMode);
  }, [autoSaveEnabled, isDarkMode]);

  const handleSave = () => {
    if (localAutoSave !== autoSaveEnabled) {
      setAutoSaveEnabled(localAutoSave);
    }
    if (localDarkMode !== isDarkMode) {
      toggleDarkMode();
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalAutoSave(autoSaveEnabled);
    setLocalDarkMode(isDarkMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 shadow-xl w-full max-w-full sm:max-w-4xl h-full sm:h-auto rounded-none sm:rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            设置
          </h2>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] sm:max-h-[70vh]">
          {/* 自动保存 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                自动保存
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                编辑后自动保存到本地
              </div>
            </div>
            <button
              onClick={() => setLocalAutoSave(!localAutoSave)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                localAutoSave ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`${
                  localAutoSave ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* 深色模式 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                深色模式
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                切换界面主题
              </div>
            </div>
            <button
              onClick={() => setLocalDarkMode(!localDarkMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                localDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`${
                  localDarkMode ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* AI 提示词设置 */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <PromptSettings
              activePromptId={activePromptId}
              onChange={setActivePromptId}
            />
          </div>

          {/* 存储信息 */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between mb-2">
                <span>存储方式</span>
                <span className="font-medium">IndexedDB (本地)</span>
              </div>
              <div className="flex justify-between">
                <span>数据位置</span>
                <span className="font-medium">浏览器本地存储</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

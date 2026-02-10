'use client';

import { useState } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';
import PromptSelector from './PromptSelector';
import PromptEditor from './PromptEditor';
import PromptPreview from './PromptPreview';
import { usePromptConfig } from '@/hooks/usePromptConfig';

interface PromptSettingsProps {
  activePromptId: string;
  onChange: (promptId: string) => void;
}

export default function PromptSettings({ activePromptId, onChange }: PromptSettingsProps) {
  const {
    prompts,
    loading,
    addCustomPrompt,
    updateCustomPrompt,
    deleteCustomPrompt,
    refresh
  } = usePromptConfig();

  const [showEditor, setShowEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPromptTemplate | undefined>();
  const [showPreview, setShowPreview] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<SystemPromptTemplate | null>(null);

  const handleAdd = () => {
    setEditingPrompt(undefined);
    setShowEditor(true);
  };

  const handleEdit = (prompt: SystemPromptTemplate) => {
    setEditingPrompt(prompt);
    setShowEditor(true);
  };

  const handleDelete = async (prompt: SystemPromptTemplate) => {
    if (!confirm(`确定要删除提示词 "${prompt.name}" 吗？`)) {
      return;
    }

    const success = await deleteCustomPrompt(prompt.id);
    if (success) {
      await refresh();
    }
  };

  const handleSave = async (data: Omit<SystemPromptTemplate, 'id' | 'category'>) => {
    if (editingPrompt) {
      await updateCustomPrompt(editingPrompt.id, data);
    } else {
      await addCustomPrompt(data);
    }

    setShowEditor(false);
    await refresh();
  };

  const handleExport = () => {
    const config = {
      customPrompts: prompts.custom,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.customPrompts)) {
        alert('导入失败：文件格式不正确');
        return;
      }

      for (const prompt of data.customPrompts) {
        await addCustomPrompt({
          name: prompt.name,
          description: prompt.description || '',
          systemPrompt: prompt.systemPrompt,
          temperature: prompt.temperature,
          outputFormat: prompt.outputFormat
        });
      }

      await refresh();
      alert(`成功导入 ${data.customPrompts.length} 个提示词`);
    } catch (error) {
      alert('导入失败：文件格式错误');
    }

    event.target.value = '';
  };

  const selectedPrompt = [...prompts.builtIn, ...prompts.custom].find(p => p.id === activePromptId);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI 提示词设置</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            导出
          </button>
          <label className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
            导入
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <PromptSelector
        value={activePromptId}
        onChange={onChange}
      />

      {selectedPrompt && (
        <div className="flex gap-2">
          {selectedPrompt.category === 'custom' && (
            <>
              <button
                onClick={() => handleEdit(selectedPrompt)}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(selectedPrompt)}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-lg"
              >
                删除
              </button>
            </>
          )}
          <button
            onClick={() => {
              setPreviewPrompt(selectedPrompt);
              setShowPreview(true);
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            预览完整内容
          </button>
        </div>
      )}

      <div className="border-t pt-4">
        <button
          onClick={handleAdd}
          className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300"
        >
          + 创建自定义提示词
        </button>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b">
              <h3 className="font-medium">
                {editingPrompt ? '编辑自定义提示词' : '创建自定义提示词'}
              </h3>
            </div>
            <div className="p-4">
              <PromptEditor
                prompt={editingPrompt}
                onSave={handleSave}
                onCancel={() => setShowEditor(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showPreview && previewPrompt && (
        <PromptPreview
          prompt={previewPrompt}
          onClose={() => {
            setShowPreview(false);
            setPreviewPrompt(null);
          }}
        />
      )}
    </div>
  );
}

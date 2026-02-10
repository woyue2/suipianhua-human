'use client';

import { useState } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';

interface PromptEditorProps {
  prompt?: SystemPromptTemplate;
  onSave: (prompt: Omit<SystemPromptTemplate, 'id' | 'category'>) => void;
  onCancel: () => void;
}

export default function PromptEditor({
  prompt,
  onSave,
  onCancel
}: PromptEditorProps) {
  const [formData, setFormData] = useState({
    name: prompt?.name ?? '',
    description: prompt?.description ?? '',
    systemPrompt: prompt?.systemPrompt ?? '',
    temperature: prompt?.temperature ?? 0.7,
    outputFormat: prompt?.outputFormat ?? 'JSON'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const newErrors: string[] = [];
    if (!formData.name.trim()) {
      newErrors.push('名称不能为空');
    }
    if (!formData.systemPrompt.trim()) {
      newErrors.push('系统提示词不能为空');
    }
    if (formData.systemPrompt.length < 50) {
      newErrors.push('系统提示词至少需要50个字符');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">
        {prompt ? '编辑自定义提示词' : '创建自定义提示词'}
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          名称 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="给提示词起个名字"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描述
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="描述这个提示词的用途"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          系统提示词 *
        </label>
        <textarea
          value={formData.systemPrompt}
          onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[200px]"
          placeholder="输入系统提示词..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.systemPrompt.length} 字符
          {formData.systemPrompt.length < 50 && '（至少需要50个字符）'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Temperature: {formData.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={formData.temperature}
          onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>精确 (0.0)</span>
          <span>平衡 (0.7)</span>
          <span>创意 (1.0)</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          期望输出格式
        </label>
        <select
          value={formData.outputFormat}
          onChange={e => setFormData({ ...formData, outputFormat: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="JSON">JSON</option>
          <option value="Markdown">Markdown</option>
          <option value="Plain">Plain Text</option>
        </select>
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}

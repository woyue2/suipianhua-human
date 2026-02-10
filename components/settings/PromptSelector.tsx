'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';
import { Plus, X, Save } from 'lucide-react';

interface PromptSelectorProps {
  value: string;
  onChange: (promptId: string) => void;
  className?: string;
  activePromptId?: string; // Backwards compatibility / alias for value
  prompts?: {
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  };
  onAddCustomPrompt?: (prompt: { name: string; description: string; systemPrompt: string }) => Promise<void>;
}

export default function PromptSelector({
  value,
  onChange,
  className = '',
  activePromptId,
  prompts: externalPrompts,
  onAddCustomPrompt
}: PromptSelectorProps) {
  // Handle alias
  const currentValue = value || activePromptId || '';

  const [internalPrompts, setInternalPrompts] = useState<{
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  }>({ builtIn: [], custom: [] });
  const [loading, setLoading] = useState(!externalPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPromptTemplate | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', systemPrompt: '' });

  // Use external prompts if provided, otherwise internal
  const prompts = externalPrompts || internalPrompts;

  const handleCreate = async () => {
    if (!onAddCustomPrompt) return;
    if (!newPrompt.name.trim() || !newPrompt.systemPrompt.trim()) return;
    
    await onAddCustomPrompt({
      name: newPrompt.name.trim(),
      description: newPrompt.description.trim(),
      systemPrompt: newPrompt.systemPrompt.trim()
    });
    
    setIsCreating(false);
    setNewPrompt({ name: '', description: '', systemPrompt: '' });
  };

  const loadPrompts = useCallback(async () => {
    if (externalPrompts) return; // Don't fetch if external prompts provided

    try {
      setLoading(true);
      const res = await fetch('/api/ai/prompt');
      const data = await res.json();
      if (data.success) {
        setInternalPrompts(data.data);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  }, [externalPrompts]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    if (currentValue && prompts.builtIn.length > 0) {
      const all = [...prompts.builtIn, ...prompts.custom];
      setSelectedPrompt(all.find(p => p.id === currentValue) || null);
    }
  }, [currentValue, prompts]);

  const categories = [
    { key: 'default', label: '默认模板' },
    { key: 'academic', label: '学术风格' },
    { key: 'meeting', label: '会议纪要' },
    { key: 'project', label: '项目管理' },
    { key: 'custom', label: '自定义' }
  ];

  const groupedBuiltIn = prompts.builtIn.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, SystemPromptTemplate[]>);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        选择提示词模板
      </label>

      {/* 分类标签 */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              const element = document.getElementById(`category-${cat.key}`);
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 提示词列表 */}
      <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
        {/* 内置提示词 */}
        {Object.entries(groupedBuiltIn).map(([category, categoryPrompts]) => (
          <div key={category}>
            <div
              id={`category-${category}`}
              className="px-3 py-2 bg-gray-50 font-medium text-sm sticky top-0"
            >
              {categories.find(c => c.key === category)?.label || category}
            </div>
            {categoryPrompts.map(prompt => (
              <div
                key={prompt.id}
                className={`p-3 cursor-pointer hover:bg-blue-50 transition ${
                  value === prompt.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onChange(prompt.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{prompt.name}</h4>
                    <p className="text-sm text-gray-500">{prompt.description}</p>
                    {prompt.scenario && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 rounded">
                        {prompt.scenario}
                      </span>
                    )}
                  </div>
                  {value === prompt.id && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* 自定义提示词 */}
        <div id="category-custom">
          <div className="px-3 py-2 bg-gray-50 font-medium text-sm sticky top-0 flex justify-between items-center">
            <span>自定义模板</span>
            {onAddCustomPrompt && !isCreating && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating(true);
                }}
                className="p-1 hover:bg-gray-200 rounded text-blue-600 transition-colors"
                title="新建自定义提示词"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {isCreating && (
            <div className="p-3 border-b bg-blue-50/50 space-y-2">
              <input 
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                placeholder="名称 (必填)" 
                value={newPrompt.name} 
                onChange={e => setNewPrompt({...newPrompt, name: e.target.value})} 
                autoFocus
              />
              <input 
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                placeholder="描述 (可选)" 
                value={newPrompt.description} 
                onChange={e => setNewPrompt({...newPrompt, description: e.target.value})} 
              />
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm h-24 focus:ring-1 focus:ring-blue-500 outline-none resize-none" 
                placeholder="系统提示词 (必填)..." 
                value={newPrompt.systemPrompt} 
                onChange={e => setNewPrompt({...newPrompt, systemPrompt: e.target.value})} 
              />
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  onClick={() => setIsCreating(false)} 
                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                  title="取消"
                >
                  <X size={16}/>
                </button>
                <button 
                  onClick={handleCreate} 
                  disabled={!newPrompt.name.trim() || !newPrompt.systemPrompt.trim()}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="保存"
                >
                  <Save size={16}/>
                </button>
              </div>
            </div>
          )}

          {prompts.custom.length === 0 && !isCreating && (
            <div className="p-8 text-center text-gray-400 text-sm">
              <p>暂无自定义提示词</p>
              {onAddCustomPrompt && (
                <button 
                  onClick={() => setIsCreating(true)} 
                  className="mt-2 text-blue-500 hover:underline"
                >
                  点击创建
                </button>
              )}
            </div>
          )}

          {prompts.custom.map(prompt => (
            <div
              key={prompt.id}
              className={`p-3 cursor-pointer hover:bg-blue-50 transition ${
                value === prompt.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onChange(prompt.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{prompt.name}</h4>
                  <p className="text-sm text-gray-500">{prompt.description}</p>
                </div>
                {value === prompt.id && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 选中提示词信息 */}
      {selectedPrompt && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <div className="font-medium">{selectedPrompt.name}</div>
          <div className="text-gray-600 mt-1">
            {selectedPrompt.systemPrompt.substring(0, 200)}
            {selectedPrompt.systemPrompt.length > 200 && '...'}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { memo, useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
}

/**
 * 标签管理组件
 * 显示标签列表，支持添加和删除
 */
export const TagManager = memo(function TagManager({
  tags,
  onAddTag,
  onRemoveTag,
  onToggleTag,
}: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
    }
  };

  // 预设标签
  const presetTags = ['#重点', '#待办', '#问题', '#想法', '#笔记'];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 已添加的标签 */}
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors group"
        >
          {tag}
          <button
            onClick={() => onRemoveTag(tag)}
            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            title="删除标签"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {/* 添加标签按钮 */}
      {isAdding ? (
        <div className="inline-flex items-center gap-1">
          <span className="text-primary">#</span>
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddTag}
            placeholder="标签名"
            autoFocus
            className="w-20 px-1 py-0.5 text-sm border-b border-primary/50 outline-none bg-transparent"
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="添加标签"
        >
          <Plus size={14} />
          <Tag size={14} />
        </button>
      )}

      {/* 预设标签（快速添加） */}
      {!isAdding && tags.length === 0 && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-slate-400">快速添加：</span>
          {presetTags.map(tag => (
            <button
              key={tag}
              onClick={() => onAddTag(tag)}
              className="text-xs text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});


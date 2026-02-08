import React, { memo } from 'react';
import { X } from 'lucide-react';

interface TagListProps {
  tags: string[];
  onRemoveTag?: (tag: string) => void;
  readOnly?: boolean;
}

/**
 * 标签列表组件（简化版）
 * 用于在节点内容旁边显示标签
 */
export const TagList = memo(function TagList({
  tags,
  onRemoveTag,
  readOnly = false,
}: TagListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <>
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded group"
        >
          {tag}
          {!readOnly && onRemoveTag && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
              title="删除标签"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
    </>
  );
});


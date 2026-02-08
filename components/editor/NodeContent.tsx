import React, { memo, KeyboardEvent } from 'react';

interface NodeContentProps {
  nodeId: string;
  content: string;
  isEditing: boolean;
  isHeader?: boolean;
  isSubHeader?: boolean;
  isItalic?: boolean;
  tags?: string[];
  inputRef: React.RefObject<HTMLInputElement>;
  onContentChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onTextSelect: () => void;
  onBlur: () => void;
  onClick: () => void;
  renderFormattedText: (text: string) => string;
}

/**
 * 节点内容组件
 * 处理节点的编辑和渲染模式
 */
export const NodeContent = memo(function NodeContent({
  nodeId,
  content,
  isEditing,
  isHeader,
  isSubHeader,
  isItalic,
  tags,
  inputRef,
  onContentChange,
  onKeyDown,
  onTextSelect,
  onBlur,
  onClick,
  renderFormattedText,
}: NodeContentProps) {
  // 文本样式
  const textStyle = isHeader
    ? 'text-xl font-bold text-slate-800 dark:text-slate-200'
    : isSubHeader
    ? 'text-lg font-bold text-slate-700 dark:text-slate-300'
    : 'text-slate-600 dark:text-slate-400';

  // 输入框样式
  const inputClassName = `node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0 ${
    isItalic ? 'italic text-slate-500' : ''
  } ${isSubHeader && tags?.includes('#重点') ? 'text-primary' : ''}`;

  // 渲染内容样式
  const renderClassName = `node-content-rendered flex-1 min-w-0 px-1 -mx-1 cursor-text ${
    isItalic ? 'italic text-slate-500' : ''
  } ${isSubHeader && tags?.includes('#重点') ? 'text-primary' : ''}`;

  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-baseline gap-2 flex-wrap ${textStyle}`}>
        {/* 编辑模式：显示输入框 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={e => onContentChange(e.target.value)}
            onKeyDown={onKeyDown}
            onSelect={onTextSelect}
            onMouseUp={onTextSelect}
            onBlur={onBlur}
            data-node-id={nodeId}
            placeholder="输入内容..."
            autoFocus
            className={inputClassName}
          />
        ) : (
          /* 渲染模式：显示格式化后的内容 */
          <div
            className={renderClassName}
            onClick={onClick}
            dangerouslySetInnerHTML={{
              __html: content
                ? renderFormattedText(content)
                : '<span class="text-slate-400">输入内容...</span>',
            }}
          />
        )}

        {/* 标签 */}
        {tags?.map(tag => (
          <span
            key={tag}
            className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});


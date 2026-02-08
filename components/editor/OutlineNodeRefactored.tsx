'use client';

import React, { memo, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import {
  useToolbarState,
  useNodeOperations,
  useTextFormatting,
  useHoverDelay,
  useNodeKeyboard,
  useTextSelection,
} from '@/hooks/useEditorStore';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Highlighter,
} from 'lucide-react';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

/**
 * 重构后的 OutlineNode 组件
 * 使用自定义 hooks 提高代码复用性和可维护性
 */
export const OutlineNodeRefactored = memo(function OutlineNodeRefactored({
  nodeId,
  depth,
}: OutlineNodeProps) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 使用自定义 hooks
  const toolbar = useToolbarState(nodeId);
  const operations = useNodeOperations(nodeId);
  const formatting = useTextFormatting();
  const keyboard = useNodeKeyboard(nodeId, operations);

  // 本地状态
  const [isEditing, setIsEditing] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [formatToolbarPosition, setFormatToolbarPosition] = useState({ x: 0, y: 0 });

  // 悬停延迟处理
  const hover = useHoverDelay(() => {
    if (nodeRef.current && !toolbar.showFormatToolbar) {
      toolbar.activateToolbar();
    }
  }, 1000);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  // 文本选择处理
  const { handleTextSelect } = useTextSelection(
    inputRef,
    (start: number, end: number, rect: DOMRect) => {
      formatting.setSelectionRange({ start, end });
      setFormatToolbarPosition({
        x: rect.left + ((start + end) / 2) * 8,
        y: rect.bottom + 5,
      });
      toolbar.activateFormatToolbar();
    }
  );

  // 鼠标事件处理
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (toolbar.showFormatToolbar) return;
    setToolbarPosition({ x: e.clientX, y: e.clientY + 20 });
    hover.startHover();
  };

  const handleMouseLeave = () => {
    hover.cancelHover();
    toolbar.deactivateToolbar();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (toolbar.showToolbar && !toolbar.showFormatToolbar) {
      setToolbarPosition({ x: e.clientX, y: e.clientY + 20 });
    }
  };

  // 格式应用
  const handleApplyFormat = (format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    const formatted = formatting.applyFormat(node.content, format);
    if (formatted) {
      operations.updateContent(formatted);
      toolbar.deactivateFormatToolbar();
    }
  };

  // 添加节点并聚焦
  const addNodeAndFocus = (addFn: () => string) => {
    const newId = addFn();
    toolbar.deactivateToolbar();
    setTimeout(() => {
      const newInput = document.querySelector(
        `input[data-node-id="${newId}"]`
      ) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

  // 样式计算
  const textStyle = () => {
    if (node.isHeader) return 'text-xl font-bold text-slate-800 dark:text-slate-200';
    if (node.isSubHeader) return 'text-lg font-bold text-slate-700 dark:text-slate-300';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getBulletClass = () => {
    const base =
      'w-2 h-2 rounded-full mt-2.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-125 ';
    return hasChildren ? base + 'bg-primary' : base + 'bg-slate-300 dark:bg-slate-600';
  };

  return (
    <div className={`flex flex-col ${depth === 0 ? 'mb-8' : 'mt-2'}`}>
      <div
        ref={nodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        className="group flex items-start gap-3 relative hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded px-2 py-1 transition-colors"
      >
        <div onClick={operations.toggleCollapse} className={getBulletClass()} />

        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-2 flex-wrap ${textStyle()}`}>
            {node.icon && <span className="mr-1">{node.icon}</span>}

            {/* 编辑/渲染模式 */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={node.content}
                onChange={e => operations.updateContent(e.target.value)}
                onKeyDown={e => keyboard.handleKeyDown(e, node.content)}
                onSelect={handleTextSelect}
                onMouseUp={handleTextSelect}
                onBlur={() => setIsEditing(false)}
                data-node-id={nodeId}
                placeholder="输入内容..."
                autoFocus
                className="node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0"
              />
            ) : (
              <div
                className="node-content-rendered flex-1 min-w-0 px-1 -mx-1 cursor-text"
                onClick={() => setIsEditing(true)}
                dangerouslySetInnerHTML={{
                  __html: node.content
                    ? formatting.renderFormattedText(node.content)
                    : '<span class="text-slate-400">输入内容...</span>',
                }}
              />
            )}

            {node.tags?.map(tag => (
              <span
                key={tag}
                className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 操作工具栏 */}
      {toolbar.showToolbar && !toolbar.showFormatToolbar && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
          style={{
            left: `${toolbarPosition.x}px`,
            transform: 'translateX(-50%)',
            top: `${toolbarPosition.y}px`,
            pointerEvents: 'auto',
          }}
          onMouseEnter={toolbar.activateToolbar}
          onMouseLeave={toolbar.deactivateToolbar}
        >
          <button
            onClick={() => addNodeAndFocus(operations.addChild)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="添加子节点 (Ctrl+Enter)"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => addNodeAndFocus(operations.addSibling)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="添加兄弟节点 (Enter)"
          >
            <Plus size={16} className="rotate-90" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => {
              operations.indent();
              toolbar.deactivateToolbar();
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="增加缩进 (Tab)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => {
              operations.outdent();
              toolbar.deactivateToolbar();
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="减少缩进 (Shift+Tab)"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => {
              operations.moveUp();
              toolbar.deactivateToolbar();
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="上移"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => {
              operations.moveDown();
              toolbar.deactivateToolbar();
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="下移"
          >
            <ChevronDown size={16} />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => {
              operations.deleteNode();
              toolbar.deactivateToolbar();
            }}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 格式工具栏 */}
      {toolbar.showFormatToolbar && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
          style={{
            left: `${formatToolbarPosition.x}px`,
            transform: 'translateX(-50%)',
            top: `${formatToolbarPosition.y}px`,
            pointerEvents: 'auto',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          <button
            onClick={() => handleApplyFormat('bold')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="粗体"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => handleApplyFormat('italic')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="斜体"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => handleApplyFormat('underline')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="下划线"
          >
            <Underline size={16} />
          </button>
          <button
            onClick={() => handleApplyFormat('highlight')}
            className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-yellow-600"
            title="荧光笔"
          >
            <Highlighter size={16} />
          </button>
        </div>
      )}

      {/* 递归渲染子节点 */}
      {!isCollapsed && hasChildren && (
        <div className="ml-1 pl-6 mt-2 border-l-2 border-slate-100 dark:border-slate-800">
          {node.children.map(childId => (
            <OutlineNodeRefactored key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});


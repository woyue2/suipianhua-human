'use client';

import React, { memo, useRef, KeyboardEvent, useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { NodeToolbar } from './NodeToolbar';
import { FormatToolbar } from './FormatToolbar';
import { useNodeFormatting } from '@/hooks/useNodeFormatting';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);
  const toggleCollapse = useEditorStore(s => s.toggleCollapse);
  const addChildNode = useEditorStore(s => s.addChildNode);
  const addSiblingNode = useEditorStore(s => s.addSiblingNode);
  const deleteNode = useEditorStore(s => s.deleteNode);
  const indentNode = useEditorStore(s => s.indentNode);
  const outdentNode = useEditorStore(s => s.outdentNode);
  const moveNodeUp = useEditorStore(s => s.moveNodeUp);
  const moveNodeDown = useEditorStore(s => s.moveNodeDown);

  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 使用全局工具栏状态，确保同一时间只有一个工具栏显示
  const activeToolbarNodeId = useEditorStore(s => s.activeToolbarNodeId);
  const activeFormatToolbarNodeId = useEditorStore(s => s.activeFormatToolbarNodeId);
  const setActiveToolbarNodeId = useEditorStore(s => s.setActiveToolbarNodeId);
  const setActiveFormatToolbarNodeId = useEditorStore(s => s.setActiveFormatToolbarNodeId);

  const showToolbar = activeToolbarNodeId === nodeId;
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the formatting hook
  const {
    showFormatToolbar,
    formatToolbarPosition,
    renderFormattedText,
    handleTextSelect,
    applyFormat,
    setShowFormatToolbar,
  } = useNodeFormatting(nodeId);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  // 处理文本选择
  const handleTextSelectWrapper = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      handleTextSelect(input);
      setActiveFormatToolbarNodeId(nodeId);
      setActiveToolbarNodeId(null); // ✅ 隐藏操作工具栏，避免冲突
    } else {
      setActiveFormatToolbarNodeId(null);
    }
  };

  // 鼠标悬停处理 - 位置改到鼠标正下方
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (showFormatToolbar) return; // ✅ 格式工具栏显示时不触发

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (nodeRef.current && !showFormatToolbar) {
        setToolbarPosition({
          x: e.clientX,
          y: e.clientY + 20 // 鼠标下方 20px
        });
        setActiveToolbarNodeId(nodeId);
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveToolbarNodeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showToolbar && !showFormatToolbar && nodeRef.current) {
      setToolbarPosition({
        x: e.clientX,
        y: e.clientY + 20 // 跟随鼠标，保持在下方
      });
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const newId = addSiblingNode(nodeId);
      setTimeout(() => {
        const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
        if (newInput) newInput.focus();
      }, 0);
    }
    else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      const newId = addChildNode(nodeId);
      setTimeout(() => {
        const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
        if (newInput) newInput.focus();
      }, 0);
    }
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      indentNode(nodeId);
    }
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      outdentNode(nodeId);
    }
    else if (e.key === 'Backspace' && node.content === '') {
      e.preventDefault();
      deleteNode(nodeId);
    }
  };

  const handleAddChild = () => {
    const newId = addChildNode(nodeId);
    setActiveToolbarNodeId(null);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

  const handleAddSibling = () => {
    const newId = addSiblingNode(nodeId);
    setActiveToolbarNodeId(null);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

  const handleIndent = () => {
    indentNode(nodeId);
    setActiveToolbarNodeId(null);
  };

  const handleOutdent = () => {
    outdentNode(nodeId);
    setActiveToolbarNodeId(null);
  };

  const handleMoveUp = () => {
    moveNodeUp(nodeId);
    setActiveToolbarNodeId(null);
  };

  const handleMoveDown = () => {
    moveNodeDown(nodeId);
    setActiveToolbarNodeId(null);
  };

  const handleDelete = () => {
    deleteNode(nodeId);
    setActiveToolbarNodeId(null);
  };

  const textStyle = () => {
    if (node.isHeader) return "text-xl font-bold text-slate-800 dark:text-slate-200";
    if (node.isSubHeader) return "text-lg font-bold text-slate-700 dark:text-slate-300";
    return "text-slate-600 dark:text-slate-400";
  };

  const getBulletClass = () => {
    const base = "w-2 h-2 rounded-full mt-2.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-125 ";
    if (hasChildren) return base + "bg-primary";
    return base + "bg-slate-300 dark:bg-slate-600";
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
        <div
          onClick={() => hasChildren && toggleCollapse(nodeId)}
          className={getBulletClass()}
        />

        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-2 flex-wrap ${textStyle()}`}>
            {node.icon && <span className="mr-1">{node.icon}</span>}

            {/* 编辑模式：显示输入框 */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={node.content}
                onChange={(e) => updateContent(nodeId, e.target.value)}
                onKeyDown={handleKeyDown}
                onSelect={handleTextSelectWrapper}
                onMouseUp={handleTextSelectWrapper}
                onBlur={() => setIsEditing(false)}
                data-node-id={nodeId}
                placeholder="输入内容..."
                autoFocus
                className={`node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0
                  ${node.isItalic ? 'italic text-slate-500' : ''}
                  ${node.isSubHeader && node.tags?.includes('#重点') ? 'text-primary' : ''}
                `}
              />
            ) : (
              /* 渲染模式：显示格式化后的内容 */
              <div
                className={`node-content-rendered flex-1 min-w-0 px-1 -mx-1 cursor-text
                  ${node.isItalic ? 'italic text-slate-500' : ''}
                  ${node.isSubHeader && node.tags?.includes('#重点') ? 'text-primary' : ''}
                `}
                onClick={() => setIsEditing(true)}
                dangerouslySetInnerHTML={{
                  __html: node.content ? renderFormattedText : '<span class="text-slate-400">输入内容...</span>'
                }}
              />
            )}

            {node.tags?.map(tag => (
              <span key={tag} className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 浮动操作工具栏 - 在鼠标正下方居中，格式工具栏显示时隐藏 */}
      {showToolbar && !showFormatToolbar && (
        <NodeToolbar
          position={toolbarPosition}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDelete={handleDelete}
          onMouseEnter={() => setActiveToolbarNodeId(nodeId)}
          onMouseLeave={() => setActiveToolbarNodeId(null)}
        />
      )}

      {/* 文本格式化工具栏 - 选中文字后显示在输入框正下方居中 */}
      {showFormatToolbar && (
        <FormatToolbar
          position={formatToolbarPosition}
          onBold={() => applyFormat('bold')}
          onItalic={() => applyFormat('italic')}
          onUnderline={() => applyFormat('underline')}
          onHighlight={() => applyFormat('highlight')}
        />
      )}

      {/* 递归渲染子节点 */}
      {!isCollapsed && hasChildren && (
        <div className="ml-1 pl-6 mt-2 border-l-2 border-slate-100 dark:border-slate-800">
          {node.children.map(childId => (
            <OutlineNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});

'use client';

import React, { memo, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/store';
import {
  useToolbarState,
  useNodeOperations,
  useTextFormatting,
  useNodeKeyboard,
} from '@/hooks/useEditorStore';
import { OperationToolbar } from './OperationToolbar';
import { FormatToolbar } from './FormatToolbar';
import { NodeBullet } from './NodeBullet';
import { NodeContent } from './NodeContent';
import { NodeChildren } from './NodeChildren';

interface OutlineNodeProps {
  nodeId: string;
  depth: number;
}

/**
 * 拆分后的 OutlineNode 组件
 * 
 * 组件结构：
 * - OutlineNode (主组件，协调逻辑)
 *   - NodeBullet (项目符号)
 *   - NodeContent (内容编辑/渲染)
 *   - OperationToolbar (操作工具栏)
 *   - FormatToolbar (格式工具栏)
 *   - NodeChildren (子节点容器)
 */
export const OutlineNode = memo(function OutlineNode({ nodeId, depth }: OutlineNodeProps) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const setShowAIModal = useEditorStore(s => s.setShowAIModal);
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  // 文本选择处理
  const handleTextSelect = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      formatting.setSelectionRange({ start, end });
      const rect = input.getBoundingClientRect();
      setFormatToolbarPosition({
        x: rect.left + ((start + end) / 2) * 8,
        y: rect.bottom + 5,
      });
      toolbar.activateFormatToolbar();
    } else {
      toolbar.deactivateFormatToolbar();
    }
  };

  // 鼠标事件处理
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (toolbar.showFormatToolbar) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (nodeRef.current && !toolbar.showFormatToolbar) {
        setToolbarPosition({ x: e.clientX, y: e.clientY + 20 });
        toolbar.activateToolbar();
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    toolbar.deactivateToolbar();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (toolbar.showToolbar && !toolbar.showFormatToolbar && nodeRef.current) {
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

  // 操作工具栏事件处理
  const handleOperationWithClose = (operation: () => void) => {
    operation();
    toolbar.deactivateToolbar();
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
        {/* 项目符号 */}
        <NodeBullet
          hasChildren={hasChildren}
          onClick={operations.toggleCollapse}
        />

        {/* 节点内容 */}
        <NodeContent
          nodeId={nodeId}
          content={node.content}
          isEditing={isEditing}
          isHeader={node.isHeader}
          isSubHeader={node.isSubHeader}
          isItalic={node.isItalic}
          inputRef={inputRef}
          onContentChange={operations.updateContent}
          onKeyDown={e => keyboard.handleKeyDown(e, node.content)}
          onTextSelect={handleTextSelect}
          onBlur={() => setIsEditing(false)}
          onClick={() => setIsEditing(true)}
          renderFormattedText={formatting.renderFormattedText}
        />
      </div>

      {/* 操作工具栏 */}
      {toolbar.showToolbar && !toolbar.showFormatToolbar && (
        <OperationToolbar
          position={toolbarPosition}
          onAddChild={() => addNodeAndFocus(operations.addChild)}
          onAddSibling={() => addNodeAndFocus(operations.addSibling)}
          onIndent={() => handleOperationWithClose(operations.indent)}
          onOutdent={() => handleOperationWithClose(operations.outdent)}
          onMoveUp={() => handleOperationWithClose(operations.moveUp)}
          onMoveDown={() => handleOperationWithClose(operations.moveDown)}
          onDelete={() => handleOperationWithClose(operations.deleteNode)}
          onAIReorganize={() => handleOperationWithClose(() => setShowAIModal(true))}
          onMouseEnter={toolbar.activateToolbar}
          onMouseLeave={toolbar.deactivateToolbar}
        />
      )}

      {/* 格式工具栏 */}
      {toolbar.showFormatToolbar && (
        <FormatToolbar position={formatToolbarPosition} onApplyFormat={handleApplyFormat} />
      )}

      {/* 子节点 */}
      {!isCollapsed && hasChildren && (
        <NodeChildren
          childIds={node.children}
          depth={depth}
          renderNode={(childId, childDepth) => (
            <OutlineNode key={childId} nodeId={childId} depth={childDepth} />
          )}
        />
      )}
    </div>
  );
});

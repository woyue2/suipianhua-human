'use client';

import React, { memo, useRef, KeyboardEvent, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { UnifiedToolbar } from './UnifiedToolbar';
import { useUnifiedToolbar } from '@/hooks/useUnifiedToolbar';
import { useNodeFormatting } from '@/hooks/useNodeFormatting';
import { ImageUploader } from './ImageUploader';
import { NodeImages } from './NodeImages';
import { IconPicker } from './IconPicker';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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
  const focusedNodeId = useEditorStore(s => s.focusedNodeId);
  const setFocusedNodeId = useEditorStore(s => s.setFocusedNodeId);
  const updateNodeIcon = useEditorStore(s => s.updateNodeIcon);

  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [isAIReorganizing, setIsAIReorganizing] = useState(false);

  // 自动聚焦新节点
  useEffect(() => {
    if (focusedNodeId === nodeId) {
      setIsEditing(true);
    }
  }, [focusedNodeId, nodeId]);

  // 当进入编辑模式时，确保输入框获得焦点
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nodeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // 使用统一工具栏 Hook
  const {
    toolbarType,
    position,
    showOperationToolbar,
    showFormatToolbar,
    delayedHide,
    cancelHide,
    updatePosition,
  } = useUnifiedToolbar(nodeId);

  // 使用格式化 Hook
  const { renderFormattedText, storeSelection, applyFormat } = useNodeFormatting(nodeId);
  
  // 使用标签 Hook

  // AI 智能整理处理函数
  const handleAIReorganize = async () => {
    if (!node.content.trim()) return;
    
    setIsAIReorganizing(true);
    try {
      const response = await fetch('/api/reorganize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: node.content }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      const result = data.analysis?.[0];

      if (result) {
        const reorganized = result.reorganized?.[0];
        if (reorganized) {
          // 1. 更新节点内容（去除标签等元数据）
          updateContent(nodeId, reorganized.content);
          
          // 2. 如果有属性，可以在这里处理（目前先处理标签）
          if (reorganized.attributes) {
            // TODO: 这里可以根据需求将 attributes 转换为标签或其他元数据
            // 目前先简单打印
            console.log('Extracted attributes:', reorganized.attributes);
          }
        }
      }
    } catch (error) {
      console.error('AI Reorganize failed:', error);
    } finally {
      setIsAIReorganizing(false);
    }
  };

  // 获取行间距设置
  const lineSpacing = useEditorStore(s => s.lineSpacing);

  const setCombinedRef = useCallback((el: HTMLDivElement | null) => {
    setActivatorNodeRef(el);
    nodeRef.current = el;
  }, [setActivatorNodeRef]);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  // 处理文本选择
  const handleTextSelectWrapper = (e: React.MouseEvent | React.SyntheticEvent) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      // 存储选区信息 - 这样 applyFormat 才能工作！
      storeSelection(input);
      
      const nativeEvent = (e as React.SyntheticEvent).nativeEvent;
      const rect = input.getBoundingClientRect();
      const point =
        typeof MouseEvent !== 'undefined' && nativeEvent instanceof MouseEvent
          ? { x: nativeEvent.clientX, y: nativeEvent.clientY }
          : { x: rect.left, y: rect.bottom };
      
      showFormatToolbar(point.x, point.y);
    }
  };

  // 鼠标悬停处理
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (toolbarType === 'format') return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (nodeRef.current) {
        showOperationToolbar(e.clientX, e.clientY);
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    delayedHide(500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (toolbarType === 'operation') {
      updatePosition(e.clientX, e.clientY);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      addSiblingNode(nodeId);
    }
    else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addChildNode(nodeId);
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

  // 获取行间距样式
  const getSpacingClass = () => {
    switch (lineSpacing) {
      case 'compact':
        return depth === 0 ? 'mb-2' : 'mt-0.5';
      case 'normal':
        return depth === 0 ? 'mb-4' : 'mt-1';
      case 'relaxed':
        return depth === 0 ? 'mb-6' : 'mt-1.5';
      case 'loose':
        return depth === 0 ? 'mb-8' : 'mt-2';
      default:
        return depth === 0 ? 'mb-4' : 'mt-1';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col ${getSpacingClass()}`}
    >
      <div
        ref={setCombinedRef}
        {...attributes}
        {...listeners}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          hoverTimeoutRef.current = setTimeout(() => {
            const rect = nodeRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            showOperationToolbar(x, y);
          }, 500);
        }}
        onTouchEnd={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
        }}
        className="group flex items-start gap-2 sm:gap-3 relative hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded px-2 py-2 sm:py-1 transition-colors active:bg-slate-100 dark:active:bg-slate-800/50"
      >
        <div
          onClick={() => {
            if (hasChildren) toggleCollapse(nodeId);
          }}
          className={getBulletClass()}
        />

        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-1 sm:gap-2 flex-wrap text-sm sm:text-base ${textStyle()}`}>
            {node.icon && (
              <>
                <span 
                  ref={iconRef}
                  className="mr-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-0.5 select-none transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIconPicker(true);
                  }}
                  title="点击更改图标"
                >
                  {node.icon}
                </span>
                {showIconPicker && (
                  <IconPicker 
                    onSelect={(icon) => {
                      updateNodeIcon(nodeId, icon);
                      setShowIconPicker(false);
                    }}
                    onClose={() => setShowIconPicker(false)}
                    triggerRef={iconRef}
                  />
                )}
              </>
            )}

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={node.content}
                onChange={(e) => updateContent(nodeId, e.target.value)}
                onKeyDown={handleKeyDown}
                onSelect={handleTextSelectWrapper}
                onMouseUp={handleTextSelectWrapper}
                onFocus={() => setFocusedNodeId(nodeId)}
                onBlur={() => setIsEditing(false)}
                data-node-id={nodeId}
                placeholder="输入内容..."
                autoFocus
                className={`node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0
                  ${node.isItalic ? 'italic text-slate-500' : ''}
                  
                `}
                // Prevent drag when interacting with input
                onPointerDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`node-content-rendered flex-1 min-w-0 px-1 -mx-1 cursor-text
                  ${node.isItalic ? 'italic text-slate-500' : ''}
                  
                `}
                onClick={() => setIsEditing(true)}
                dangerouslySetInnerHTML={{
                  __html: node.content ? renderFormattedText : '<span class="text-slate-400">输入内容...</span>'
                }}
              />
            )}

          </div>

          {/* 图片显示区域 - 在节点内容下方 */}
          {node.images && node.images.length > 0 && (
            <NodeImages nodeId={nodeId} images={node.images} />
          )}
        </div>
      </div>

      {/* 统一工具栏 - 根据类型显示不同内容 */}
      {toolbarType && (
        <UnifiedToolbar
          type={toolbarType}
          position={position}
          onMouseEnter={cancelHide}
          onMouseLeave={() => delayedHide(toolbarType === 'format' ? 1000 : 500)}
        >
          {toolbarType === 'operation' ? (
            <>
              <button onClick={() => addChildNode(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="添加子节点 (Ctrl+Enter)">
                <span className="text-lg">⤵️</span>
              </button>
              <button onClick={() => addSiblingNode(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="添加同级节点 (Enter)">
                <span className="text-lg">➕</span>
              </button>
              <button onClick={() => indentNode(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="缩进 (Tab)">
                <span className="text-lg">→</span>
              </button>
              <button onClick={() => outdentNode(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="取消缩进 (Shift+Tab)">
                <span className="text-lg">←</span>
              </button>
              <button onClick={() => moveNodeUp(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="上移">
                <span className="text-lg">↑</span>
              </button>
              <button onClick={() => moveNodeDown(nodeId)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="下移">
                <span className="text-lg">↓</span>
              </button>
              <button onClick={() => deleteNode(nodeId)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors" title="删除">
                <span className="text-lg">🗑</span>
              </button>
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
              <button
                onClick={handleAIReorganize}
                disabled={isAIReorganizing}
                className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors ${isAIReorganizing ? 'animate-pulse' : ''}`}
                title="AI 智能整理"
              >
                <span className="text-lg">✨</span>
              </button>
              {!node.icon && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateNodeIcon(nodeId, '📄');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  title="添加图标"
                >
                  <span className="text-lg">😊</span>
                </button>
              )}
              <ImageUploader nodeId={nodeId} />
            </>
          ) : (
            <>
              <button onClick={() => applyFormat('bold')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors font-bold" title="粗体">
                B
              </button>
              <button onClick={() => applyFormat('italic')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors italic" title="斜体">
                I
              </button>
              <button onClick={() => applyFormat('underline')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors underline" title="下划线">
                U
              </button>
              <button onClick={() => applyFormat('highlight')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="高亮">
                <span className="bg-yellow-200 dark:bg-yellow-600 px-1">H</span>
              </button>
            </>
          )}
        </UnifiedToolbar>
      )}

      {/* 递归渲染子节点 */}
      {!isCollapsed && hasChildren && (
        <div className="ml-1 pl-6 mt-2 border-l-2 border-slate-100 dark:border-slate-800">
          <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
            {node.children.map(childId => (
              <OutlineNode key={childId} nodeId={childId} depth={depth + 1} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
});

'use client';

import React, { memo, useRef, KeyboardEvent, useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Bold, Italic, Underline, Highlighter } from 'lucide-react';

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
  const [showToolbar, setShowToolbar] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [formatToolbarPosition, setFormatToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed || false;

  // 处理文本选择
  const handleTextSelect = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    if (start !== end) {
      const selected = node.content.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });
      
      // 获取输入框位置
      const rect = input.getBoundingClientRect();
      setFormatToolbarPosition({
        x: rect.left + (start + end) / 2 * 8, // 粗略估算字符位置
        y: rect.bottom + 5
      });
      setShowFormatToolbar(true);
    } else {
      setShowFormatToolbar(false);
    }
  };

  // 应用格式
  const applyFormat = (format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    if (!selectionRange) return;
    
    const { start, end } = selectionRange;
    const before = node.content.substring(0, start);
    const selected = node.content.substring(start, end);
    const after = node.content.substring(end);
    
    let formatted = '';
    switch (format) {
      case 'bold':
        formatted = `${before}**${selected}**${after}`;
        break;
      case 'italic':
        formatted = `${before}*${selected}*${after}`;
        break;
      case 'underline':
        formatted = `${before}<u>${selected}</u>${after}`;
        break;
      case 'highlight':
        formatted = `${before}==${selected}==${after}`;
        break;
    }
    
    updateContent(nodeId, formatted);
    setShowFormatToolbar(false);
    
    console.log(`✏️ Applied ${format} to: "${selected}"`);
  };

  // 鼠标悬停处理 - 位置改到鼠标下方
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (nodeRef.current) {
        setToolbarPosition({
          x: e.clientX,
          y: e.clientY + 20 // 鼠标下方 20px
        });
        setShowToolbar(true);
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowToolbar(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showToolbar && nodeRef.current) {
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
    setShowToolbar(false);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
  };

  const handleAddSibling = () => {
    const newId = addSiblingNode(nodeId);
    setShowToolbar(false);
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-node-id="${newId}"]`) as HTMLInputElement;
      if (newInput) newInput.focus();
    }, 0);
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

  // 渲染带格式的文本
  const renderFormattedText = (text: string) => {
    // 简单的 Markdown 样式渲染
    let formatted = text;
    
    // 粗体 **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 斜体 *text*
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 下划线 <u>text</u>
    // 已经是 HTML，不需要替换
    
    // 荧光笔 ==text==
    formatted = formatted.replace(/==(.+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
    
    return formatted;
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
            
            <input
              ref={inputRef}
              type="text"
              value={node.content}
              onChange={(e) => updateContent(nodeId, e.target.value)}
              onKeyDown={handleKeyDown}
              onSelect={handleTextSelect}
              onMouseUp={handleTextSelect}
              data-node-id={nodeId}
              placeholder="输入内容..."
              className={`node-content border-none bg-transparent outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1 flex-1 min-w-0
                ${node.isItalic ? 'italic text-slate-500' : ''}
                ${node.isSubHeader && node.tags?.includes('#重点') ? 'text-primary' : ''}
              `}
            />
            
            {node.tags?.map(tag => (
              <span key={tag} className="text-sm font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 浮动操作工具栏 - 在鼠标下方 */}
      {showToolbar && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
          style={{
            left: `${toolbarPosition.x - 150}px`,
            top: `${toolbarPosition.y}px`,
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => setShowToolbar(true)}
          onMouseLeave={() => setShowToolbar(false)}
        >
          <button
            onClick={handleAddChild}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="添加子节点 (Ctrl+Enter)"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleAddSibling}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="添加兄弟节点 (Enter)"
          >
            <Plus size={16} className="rotate-90" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => { indentNode(nodeId); setShowToolbar(false); }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="增加缩进 (Tab)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => { outdentNode(nodeId); setShowToolbar(false); }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="减少缩进 (Shift+Tab)"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => { moveNodeUp(nodeId); setShowToolbar(false); }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="上移"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => { moveNodeDown(nodeId); setShowToolbar(false); }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="下移"
          >
            <ChevronDown size={16} />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={() => { deleteNode(nodeId); setShowToolbar(false); }}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors"
            title="删除 (Backspace on empty)"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 文本格式化工具栏 - 选中文字后显示 */}
      {showFormatToolbar && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
          style={{
            left: `${formatToolbarPosition.x - 100}px`,
            top: `${formatToolbarPosition.y}px`,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
        >
          <button
            onClick={() => applyFormat('bold')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="粗体"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => applyFormat('italic')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="斜体"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => applyFormat('underline')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
            title="下划线"
          >
            <Underline size={16} />
          </button>
          <button
            onClick={() => applyFormat('highlight')}
            className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400 transition-colors"
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
            <OutlineNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});

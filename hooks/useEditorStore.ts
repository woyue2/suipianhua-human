import { useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/store';

/**
 * 自定义 Hooks 集合
 * 提高代码复用性，减少重复逻辑
 */

/**
 * Hook: 工具栏状态管理
 * 用于管理节点的操作工具栏和格式工具栏
 */
export function useToolbarState(nodeId: string) {
  const activeToolbarNodeId = useEditorStore(s => s.activeToolbarNodeId);
  const activeFormatToolbarNodeId = useEditorStore(s => s.activeFormatToolbarNodeId);
  const setActiveToolbarNodeId = useEditorStore(s => s.setActiveToolbarNodeId);
  const setActiveFormatToolbarNodeId = useEditorStore(s => s.setActiveFormatToolbarNodeId);

  const showToolbar = activeToolbarNodeId === nodeId;
  const showFormatToolbar = activeFormatToolbarNodeId === nodeId;

  const activateToolbar = useCallback(() => {
    setActiveToolbarNodeId(nodeId);
  }, [nodeId, setActiveToolbarNodeId]);

  const deactivateToolbar = useCallback(() => {
    setActiveToolbarNodeId(null);
  }, [setActiveToolbarNodeId]);

  const activateFormatToolbar = useCallback(() => {
    setActiveFormatToolbarNodeId(nodeId);
    setActiveToolbarNodeId(null); // 互斥
  }, [nodeId, setActiveFormatToolbarNodeId, setActiveToolbarNodeId]);

  const deactivateFormatToolbar = useCallback(() => {
    setActiveFormatToolbarNodeId(null);
  }, [setActiveFormatToolbarNodeId]);

  return {
    showToolbar,
    showFormatToolbar,
    activateToolbar,
    deactivateToolbar,
    activateFormatToolbar,
    deactivateFormatToolbar,
  };
}

/**
 * Hook: 节点操作
 * 封装所有节点相关的操作
 */
export function useNodeOperations(nodeId: string) {
  const updateContent = useEditorStore(s => s.updateNodeContent);
  const toggleCollapse = useEditorStore(s => s.toggleCollapse);
  const addChildNode = useEditorStore(s => s.addChildNode);
  const addSiblingNode = useEditorStore(s => s.addSiblingNode);
  const deleteNode = useEditorStore(s => s.deleteNode);
  const indentNode = useEditorStore(s => s.indentNode);
  const outdentNode = useEditorStore(s => s.outdentNode);
  const moveNodeUp = useEditorStore(s => s.moveNodeUp);
  const moveNodeDown = useEditorStore(s => s.moveNodeDown);

  const handleUpdateContent = useCallback(
    (content: string) => {
      updateContent(nodeId, content);
    },
    [nodeId, updateContent]
  );

  const handleToggleCollapse = useCallback(() => {
    toggleCollapse(nodeId);
  }, [nodeId, toggleCollapse]);

  const handleAddChild = useCallback(() => {
    return addChildNode(nodeId);
  }, [nodeId, addChildNode]);

  const handleAddSibling = useCallback(() => {
    return addSiblingNode(nodeId);
  }, [nodeId, addSiblingNode]);

  const handleDelete = useCallback(() => {
    deleteNode(nodeId);
  }, [nodeId, deleteNode]);

  const handleIndent = useCallback(() => {
    indentNode(nodeId);
  }, [nodeId, indentNode]);

  const handleOutdent = useCallback(() => {
    outdentNode(nodeId);
  }, [nodeId, outdentNode]);

  const handleMoveUp = useCallback(() => {
    moveNodeUp(nodeId);
  }, [nodeId, moveNodeUp]);

  const handleMoveDown = useCallback(() => {
    moveNodeDown(nodeId);
  }, [nodeId, moveNodeDown]);

  return {
    updateContent: handleUpdateContent,
    toggleCollapse: handleToggleCollapse,
    addChild: handleAddChild,
    addSibling: handleAddSibling,
    deleteNode: handleDelete,
    indent: handleIndent,
    outdent: handleOutdent,
    moveUp: handleMoveUp,
    moveDown: handleMoveDown,
  };
}

/**
 * Hook: 文本格式化
 * 处理 Markdown 格式的应用和渲染
 */
export function useTextFormatting() {
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const renderFormattedText = useCallback((text: string): string => {
    if (!text) return '';

    let formatted = text;

    // 荧光笔 ==text== (先处理，避免被斜体干扰)
    formatted = formatted.replace(
      /==(.+?)==/g,
      '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">$1</mark>'
    );

    // 粗体 **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // 斜体 *text* (注意不要匹配 **)
    formatted = formatted.replace(
      /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
      '<em class="italic">$1</em>'
    );

    // 下划线 <u>text</u> (已经是 HTML，不需要替换)

    return formatted;
  }, []);

  const applyFormat = useCallback(
    (
      content: string,
      format: 'bold' | 'italic' | 'underline' | 'highlight'
    ): string | null => {
      if (!selectionRange) return null;

      const { start, end } = selectionRange;
      const before = content.substring(0, start);
      const selected = content.substring(start, end);
      const after = content.substring(end);

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

      return formatted;
    },
    [selectionRange]
  );

  return {
    renderFormattedText,
    applyFormat,
    selectionRange,
    setSelectionRange,
  };
}

/**
 * Hook: 悬停延迟
 * 处理鼠标悬停延迟显示工具栏
 */
export function useHoverDelay(callback: () => void, delay: number = 1000) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startHover = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      callback();
    }, delay);

    setTimeoutId(id);
  }, [callback, delay, timeoutId]);

  const cancelHover = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return {
    startHover,
    cancelHover,
  };
}

/**
 * Hook: 键盘快捷键
 * 处理节点编辑时的键盘事件
 */
export function useNodeKeyboard(
  nodeId: string,
  operations: ReturnType<typeof useNodeOperations>
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, content: string) => {
      // Enter: 添加兄弟节点
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        const newId = operations.addSibling();
        setTimeout(() => {
          const newInput = document.querySelector(
            `input[data-node-id="${newId}"]`
          ) as HTMLInputElement;
          if (newInput) newInput.focus();
        }, 0);
      }
      // Ctrl+Enter: 添加子节点
      else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const newId = operations.addChild();
        setTimeout(() => {
          const newInput = document.querySelector(
            `input[data-node-id="${newId}"]`
          ) as HTMLInputElement;
          if (newInput) newInput.focus();
        }, 0);
      }
      // Tab: 增加缩进
      else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        operations.indent();
      }
      // Shift+Tab: 减少缩进
      else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        operations.outdent();
      }
      // Backspace: 删除空节点
      else if (e.key === 'Backspace' && content === '') {
        e.preventDefault();
        operations.deleteNode();
      }
    },
    [operations]
  );

  return { handleKeyDown };
}

/**
 * Hook: 文本选择
 * 处理文本选择和格式工具栏显示
 */
export function useTextSelection(
  inputRef: React.RefObject<HTMLInputElement>,
  onSelect: (start: number, end: number, rect: DOMRect) => void
) {
  const handleTextSelect = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      const rect = input.getBoundingClientRect();
      onSelect(start, end, rect);
    }
  }, [inputRef, onSelect]);

  return { handleTextSelect };
}

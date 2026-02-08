import { useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/lib/store';

export function useNodeFormatting(nodeId: string) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);

  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [formatToolbarPosition, setFormatToolbarPosition] = useState({ x: 0, y: 0 });

  // Render formatted text with Markdown syntax
  const renderFormattedText = useMemo(() => {
    if (!node?.content) return '';

    let formatted = node.content;

    // Highlight ==text== (process first to avoid italic interference)
    formatted = formatted.replace(/==(.+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">$1</mark>');

    // Bold **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Italic *text* (avoid matching **)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');

    return formatted;
  }, [node?.content]);

  // Handle text selection
  const handleTextSelect = useCallback((input: HTMLInputElement) => {
    if (!input || !node) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      const selected = node.content.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });

      const rect = input.getBoundingClientRect();
      setFormatToolbarPosition({
        x: rect.left + (start + end) / 2 * 8,
        y: rect.bottom + 5,
      });
      setShowFormatToolbar(true);
    } else {
      setShowFormatToolbar(false);
    }
  }, [node]);

  // Apply format to selected text
  const applyFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    if (!selectionRange || !node) return;

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
  }, [selectionRange, node, nodeId, updateContent]);

  return {
    selectedText,
    showFormatToolbar,
    formatToolbarPosition,
    renderFormattedText,
    handleTextSelect,
    applyFormat,
    setShowFormatToolbar,
  };
}

import { useState, useCallback, useMemo, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { renderMarkdown } from '@/lib/utils';

export function useNodeFormatting(nodeId: string) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);

  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null);

  // Render formatted text with Markdown syntax using XSS protection
  const renderFormattedText = useMemo(() => {
    return renderMarkdown(node?.content || '');
  }, [node?.content]);

  // Store selection range when text is selected
  const storeSelection = useCallback((input: HTMLInputElement) => {
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (start !== end) {
      selectionRangeRef.current = { start, end };
    }
  }, []);

  // Apply format to selected text
  const applyFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    const selectionRange = selectionRangeRef.current;
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
    
    // Clear selection after formatting
    selectionRangeRef.current = null;
  }, [node, nodeId, updateContent]);

  return {
    renderFormattedText,
    storeSelection,
    applyFormat,
  };
}

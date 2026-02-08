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

    let openTag = '';
    let closeTag = '';

    switch (format) {
      case 'bold':
        openTag = '**';
        closeTag = '**';
        break;
      case 'italic':
        openTag = '*';
        closeTag = '*';
        break;
      case 'underline':
        openTag = '<u>';
        closeTag = '</u>';
        break;
      case 'highlight':
        openTag = '==';
        closeTag = '==';
        break;
    }

    let formatted = '';
    
    // Check if the selection itself contains the tags at boundaries
    // e.g. selected is "**text**"
    const isWrappedInner = selected.startsWith(openTag) && selected.endsWith(closeTag) && selected.length >= openTag.length + closeTag.length;
    
    // Check if the selection is surrounded by tags
    // e.g. before ends with "**" and after starts with "**"
    const isWrappedOuter = before.endsWith(openTag) && after.startsWith(closeTag);

    if (isWrappedInner) {
      // Remove tags from inside selection
      formatted = before + selected.substring(openTag.length, selected.length - closeTag.length) + after;
    } else if (isWrappedOuter) {
      // Remove tags from outside selection
      formatted = before.substring(0, before.length - openTag.length) + selected + after.substring(closeTag.length);
    } else {
      // Add tags
      formatted = before + openTag + selected + closeTag + after;
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

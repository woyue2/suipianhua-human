'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COMMON_EMOJIS } from '@/lib/constants';

interface IconPickerProps {
  onSelect: (icon: string) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose, triggerRef }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const pickerHeight = 300; // Estimated height
      
      let top = rect.bottom + 8;
      // If picker would go off screen, show it above
      if (top + pickerHeight > viewportHeight) {
        top = rect.top - pickerHeight - 8;
      }
      
      setPosition({
        top,
        left: rect.left,
      });
    }
  }, [triggerRef]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-2 w-72 max-h-[300px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="grid grid-cols-8 gap-1">
        {COMMON_EMOJIS.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-lg transition-colors"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

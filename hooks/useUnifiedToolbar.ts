'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

export type ToolbarType = 'operation' | 'format' | null;

/**
 * 统一工具栏 Hook - 控制操作工具栏和格式工具栏
 * 确保同一时间只显示一个工具栏
 */
export function useUnifiedToolbar(nodeId: string) {
  const [toolbarType, setToolbarType] = useState<ToolbarType>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disableOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOperationDisabled, setIsOperationDisabled] = useState(false);
  
  const activeToolbarNodeId = useEditorStore(s => s.activeToolbarNodeId);
  const setActiveToolbarNodeId = useEditorStore(s => s.setActiveToolbarNodeId);

  // 只有当前节点是激活节点时才显示工具栏
  const isActive = activeToolbarNodeId === nodeId;

  // 显示操作工具栏（悬停触发）
  const showOperationToolbar = (x: number, y: number) => {
    // ✅ 如果操作工具栏被禁用，不显示
    if (isOperationDisabled) return;
    
    clearAllTimeouts();
    setPosition({ x, y: y + 5 }); // 紧贴鼠标 5px
    setToolbarType('operation');
    setActiveToolbarNodeId(nodeId);
  };

  // 显示格式工具栏（选中文字触发）
  const showFormatToolbar = (x: number, y: number) => {
    clearAllTimeouts();
    setPosition({ x, y: y + 5 }); // 紧贴鼠标 5px
    setToolbarType('format');
    setActiveToolbarNodeId(nodeId);
    
    // ✅ 禁用操作工具栏 3 秒
    setIsOperationDisabled(true);
    if (disableOperationTimeoutRef.current) {
      clearTimeout(disableOperationTimeoutRef.current);
    }
    disableOperationTimeoutRef.current = setTimeout(() => {
      setIsOperationDisabled(false);
    }, 3000);
    
    // 2秒后自动关闭格式工具栏
    timeoutRef.current = setTimeout(() => {
      hideToolbar();
    }, 2000);
  };

  // 隐藏工具栏
  const hideToolbar = () => {
    clearAllTimeouts();
    setToolbarType(null);
    setActiveToolbarNodeId(null);
  };

  // 延迟隐藏（给用户时间移动鼠标）
  const delayedHide = (delay: number = 500) => {
    clearAllTimeouts();
    timeoutRef.current = setTimeout(() => {
      hideToolbar();
    }, delay);
  };

  // 取消隐藏（鼠标进入工具栏时）
  const cancelHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 清理所有定时器
  const clearAllTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 更新位置（鼠标移动时）
  const updatePosition = (x: number, y: number) => {
    if (isActive && toolbarType === 'operation') {
      setPosition({ x, y: y + 5 });
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      if (disableOperationTimeoutRef.current) {
        clearTimeout(disableOperationTimeoutRef.current);
      }
    };
  }, []);

  // 如果不是激活节点，隐藏工具栏
  useEffect(() => {
    if (!isActive) {
      setToolbarType(null);
    }
  }, [isActive]);

  return {
    toolbarType: isActive ? toolbarType : null,
    position,
    showOperationToolbar,
    showFormatToolbar,
    hideToolbar,
    delayedHide,
    cancelHide,
    updatePosition,
    isOperationDisabled, // ✅ 导出禁用状态
  };
}

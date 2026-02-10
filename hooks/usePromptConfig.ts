'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemPromptTemplate } from '@/lib/prompts/types';

interface UsePromptConfigReturn {
  prompts: {
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  };
  loading: boolean;
  activePromptId: string;
  setActivePromptId: (id: string) => Promise<boolean>;
  addCustomPrompt: (prompt: Omit<SystemPromptTemplate, 'id' | 'category'>) => Promise<SystemPromptTemplate | null>;
  updateCustomPrompt: (id: string, updates: Partial<SystemPromptTemplate>) => Promise<boolean>;
  deleteCustomPrompt: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  loadPrompts: () => Promise<void>;
}

export function usePromptConfig(): UsePromptConfigReturn {
  const [prompts, setPrompts] = useState<{
    builtIn: SystemPromptTemplate[];
    custom: SystemPromptTemplate[];
  }>({ builtIn: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [activePromptId, setActivePromptIdState] = useState('reorganize-default');

  const loadPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/prompt');
      const data = await res.json();
      if (data.success) {
        setPrompts(data.data);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const setActivePromptId = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/ai/prompt?id=${encodeURIComponent(id)}`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        setActivePromptIdState(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set active prompt:', error);
      return false;
    }
  }, []);

  const addCustomPrompt = useCallback(async (
    prompt: Omit<SystemPromptTemplate, 'id' | 'category'>
  ): Promise<SystemPromptTemplate | null> => {
    try {
      const res = await fetch('/api/ai/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });
      const data = await res.json();
      if (data.success) {
        await loadPrompts();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to add custom prompt:', error);
      return null;
    }
  }, [loadPrompts]);

  const updateCustomPrompt = useCallback(async (
    id: string,
    updates: Partial<SystemPromptTemplate>
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/ai/prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        await loadPrompts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update custom prompt:', error);
      return false;
    }
  }, [loadPrompts]);

  const deleteCustomPrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/ai/prompt?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await loadPrompts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete custom prompt:', error);
      return false;
    }
  }, [loadPrompts]);

  return {
    prompts,
    loading,
    activePromptId,
    setActivePromptId,
    addCustomPrompt,
    updateCustomPrompt,
    deleteCustomPrompt,
    refresh: loadPrompts,
    loadPrompts
  };
}

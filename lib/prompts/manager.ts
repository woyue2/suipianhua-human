import {
  SystemPromptTemplate,
  PromptConfig,
  PromptValidationResult
} from './types';
import { DEFAULT_REORGANIZE_PROMPTS, SCENARIO_PROMPTS } from './defaults';

const STORAGE_KEY = 'ai-prompt-config';

class PromptManager {
  private config: PromptConfig;
  private builtInPrompts: Map<string, SystemPromptTemplate>;

  constructor() {
    this.builtInPrompts = new Map();
    this.config = this.loadConfig();
    this.initializeBuiltInPrompts();
  }

  private initializeBuiltInPrompts() {
    const allBuiltIn = [
      ...DEFAULT_REORGANIZE_PROMPTS,
      ...SCENARIO_PROMPTS
    ];

    for (const prompt of allBuiltIn) {
      this.builtInPrompts.set(prompt.id, prompt);
    }
  }

  getPrompt(id: string): SystemPromptTemplate | null {
    const custom = this.config.customPrompts.find(p => p.id === id);
    if (custom) return custom;
    return this.builtInPrompts.get(id) || null;
  }

  getAllPrompts(): { builtIn: SystemPromptTemplate[]; custom: SystemPromptTemplate[] } {
    return {
      builtIn: Array.from(this.builtInPrompts.values()),
      custom: this.config.customPrompts
    };
  }

  getPromptsByCategory(category: string): SystemPromptTemplate[] {
    const all = this.getAllPrompts();
    return [...all.builtIn, ...all.custom].filter(p => p.category === category);
  }

  addCustomPrompt(prompt: Omit<SystemPromptTemplate, 'id'>): SystemPromptTemplate {
    const id = `custom-${Date.now()}`;
    const newPrompt: SystemPromptTemplate = {
      ...prompt,
      id,
      category: 'custom'
    };

    this.config.customPrompts.push(newPrompt);
    this.saveConfig();

    return newPrompt;
  }

  updateCustomPrompt(id: string, updates: Partial<SystemPromptTemplate>): boolean {
    const index = this.config.customPrompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.config.customPrompts[index] = {
      ...this.config.customPrompts[index],
      ...updates
    };

    this.saveConfig();
    return true;
  }

  deleteCustomPrompt(id: string): boolean {
    const index = this.config.customPrompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.config.customPrompts.splice(index, 1);

    if (this.config.activePromptId === id) {
      this.config.activePromptId = 'reorganize-default';
    }

    this.saveConfig();
    return true;
  }

  validatePrompt(prompt: Partial<SystemPromptTemplate>): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!prompt.name?.trim()) {
      errors.push('名称不能为空');
      score -= 20;
    }

    if (!prompt.systemPrompt?.trim()) {
      errors.push('系统提示词不能为空');
      score -= 30;
    }

    if (prompt.systemPrompt && prompt.systemPrompt.length < 50) {
      warnings.push('系统提示词过短，可能无法提供清晰指导');
      score -= 10;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  renderTemplate(
    template: SystemPromptTemplate,
    variables: Record<string, string>
  ): { systemPrompt: string } {
    let systemPrompt = template.systemPrompt;

    for (const [key, value] of Object.entries(variables)) {
      systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return { systemPrompt };
  }

  getActivePromptId(): string {
    return this.config.activePromptId;
  }

  setActivePromptId(id: string): boolean {
    const prompt = this.getPrompt(id);
    if (!prompt) return false;

    this.config.activePromptId = id;
    this.saveConfig();
    return true;
  }

  private loadConfig(): PromptConfig {
    if (typeof window === 'undefined') {
      return this.getDefaultConfig();
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.migrateConfig(parsed);
      }
    } catch (e) {
      console.error('Failed to load prompt config:', e);
    }

    return this.getDefaultConfig();
  }

  private migrateConfig(
    oldConfig: Record<string, unknown> & {
      preferences?: Record<string, unknown>;
    }
  ): PromptConfig {
    return {
      activePromptId: String(oldConfig.activePromptId ?? 'reorganize-default'),
      customPrompts: Array.isArray(oldConfig.customPrompts) ? oldConfig.customPrompts : [],
      preferences: {
        autoSave: Boolean(oldConfig.preferences?.autoSave ?? true),
        showPreview: Boolean(oldConfig.preferences?.showPreview ?? true),
        confirmDangerous: Boolean(oldConfig.preferences?.confirmDangerous ?? true)
      }
    };
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save prompt config:', e);
    }
  }

  private getDefaultConfig(): PromptConfig {
    return {
      activePromptId: 'reorganize-default',
      customPrompts: [],
      preferences: {
        autoSave: true,
        showPreview: true,
        confirmDangerous: true
      }
    };
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);

      if (typeof data.activePromptId !== 'string') {
        return { success: false, error: '缺少 activePromptId' };
      }

      if (Array.isArray(data.customPrompts)) {
        for (const prompt of data.customPrompts) {
          if (!prompt.id || !prompt.name || !prompt.systemPrompt) {
            return { success: false, error: `提示词 "${prompt.name}" 缺少必要字段` };
          }
        }
      }

      this.config = this.migrateConfig(data);
      this.saveConfig();

      return { success: true };
    } catch (e) {
      return { success: false, error: 'JSON 格式错误' };
    }
  }
}

export const promptManager = new PromptManager();

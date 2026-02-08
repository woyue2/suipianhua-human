import { StoredOutlineNode, SidebarItem } from '@/types';

/**
 * 应用常量配置
 * 集中管理硬编码值，便于维护和修改
 */

// ============================================
// 行间距配置
// ============================================

/**
 * 行间距配置
 */
export const LINE_SPACING_CONFIG = {
  compact: {
    value: 'compact' as const,
    label: '紧凑',
    description: '1.2x',
    classes: {
      topLevel: 'mb-4',  // 顶级节点底部间距
      nested: 'mt-1',    // 嵌套节点顶部间距
    },
  },
  normal: {
    value: 'normal' as const,
    label: '正常',
    description: '1.6x',
    classes: {
      topLevel: 'mb-8',
      nested: 'mt-2',
    },
  },
  relaxed: {
    value: 'relaxed' as const,
    label: '舒适',
    description: '2.0x',
    classes: {
      topLevel: 'mb-12',
      nested: 'mt-3',
    },
  },
  loose: {
    value: 'loose' as const,
    label: '宽松',
    description: '2.5x',
    classes: {
      topLevel: 'mb-16',
      nested: 'mt-4',
    },
  },
} as const;

/**
 * 行间距类型
 */
export type LineSpacingType = keyof typeof LINE_SPACING_CONFIG;

/**
 * 默认值配置
 */
export const DEFAULTS = {
  /** 默认行间距 */
  LINE_SPACING: 'normal' as LineSpacingType,
} as const;

/**
 * 获取行间距样式类
 * @param spacing 行间距类型
 * @param isTopLevel 是否为顶级节点
 * @returns Tailwind CSS 类名
 */
export function getLineSpacingClass(
  spacing: LineSpacingType,
  isTopLevel: boolean
): string {
  const config = LINE_SPACING_CONFIG[spacing] || LINE_SPACING_CONFIG.normal;
  return isTopLevel ? config.classes.topLevel : config.classes.nested;
}

/**
 * 获取所有行间距选项（用于 UI 选择器）
 */
export function getLineSpacingOptions() {
  return Object.values(LINE_SPACING_CONFIG).map(config => ({
    value: config.value,
    label: config.label,
    description: config.description,
  }));
}

// ============================================
// 初始数据
// ============================================

// 将原始数据转换为扁平化存储格式
export const INITIAL_NODES: Record<string, StoredOutlineNode> = {
  'root': {
    id: 'root',
    parentId: null,
    content: '读书笔记《我们如何学习》',
    level: 0,
    children: ['1', '2', '3'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    icon: '📚',
  },
  '1': {
    id: '1',
    parentId: 'root',
    content: '读前说明',
    level: 1,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isHeader: true,
  },
  '2': {
    id: '2',
    parentId: 'root',
    content: '正文拆解',
    level: 1,
    children: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isHeader: true,
  },
  '2-1': {
    id: '2-1',
    parentId: '2',
    content: '第一章：学习的机器',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
  },
  '2-2': {
    id: '2-2',
    parentId: '2',
    content: '第二章：规则和假设',
    level: 2,
    children: ['2-2-1', '2-2-2'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
    tags: ['#重点'],
  },
  '2-2-1': {
    id: '2-2-1',
    parentId: '2-2',
    content: '人脑的学习优势：迪昂列举了和人脑相对于机器学习的六个优势',
    level: 3,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-2-2': {
    id: '2-2-2',
    parentId: '2-2',
    content: '迪昂认为，人脑学习的优势，关键在于两个能力。一个是规则，一个是假设。',
    level: 3,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-3': {
    id: '2-3',
    parentId: '2',
    content: '第三章：宝宝自身具足',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
    tags: ['#重点'],
  },
  '2-4': {
    id: '2-4',
    parentId: '2',
    content: '第四章：学习是生理现象',
    level: 2,
    children: ['2-4-1', '2-4-2', '2-4-3', '2-4-4'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
    tags: ['#重点'],
  },
  '2-4-1': {
    id: '2-4-1',
    parentId: '2-4',
    content: '1.神经的连接',
    level: 3,
    children: ['2-4-1-1', '2-4-1-2'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-4-1-1': {
    id: '2-4-1-1',
    parentId: '2-4-1',
    content: '一切知识和技能都是以神经元连接的形式存在于大脑之中。',
    level: 4,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isItalic: true,
  },
  '2-4-1-2': {
    id: '2-4-1-2',
    parentId: '2-4-1',
    content: '学习过程更多的时强化现有的一些连接，而不是建立新连接。事实上你就算什么都不做，大脑也在忙着建立连接。',
    level: 4,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isItalic: true,
  },
  '2-4-2': {
    id: '2-4-2',
    parentId: '2-4',
    content: '2.知识是什么',
    level: 3,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-4-3': {
    id: '2-4-3',
    parentId: '2-4',
    content: '3.学习的敏感期',
    level: 3,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-4-4': {
    id: '2-4-4',
    parentId: '2-4',
    content: '那你该说大脑为什么非得有一个敏感期，为什么不一直都保持高度的可塑性呢？',
    level: 3,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2-5': {
    id: '2-5',
    parentId: '2',
    content: '第五章：旧脑的新用',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
  },
  '2-6': {
    id: '2-6',
    parentId: '2',
    content: '第六章：电子游戏能提高专注力吗？',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
  },
  '2-7': {
    id: '2-7',
    parentId: '2',
    content: '第七章："积极"是多积极？',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSubHeader: true,
  },
  '3': {
    id: '3',
    parentId: 'root',
    content: '读书感悟与思考？',
    level: 1,
    children: ['3-1', '3-2', '3-3'],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isHeader: true,
    tags: ['#重点'],
  },
  '3-1': {
    id: '3-1',
    parentId: '3',
    content: '关于学习的最新揭秘',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '3-2': {
    id: '3-2',
    parentId: '3',
    content: '学习的四个支柱，缺一不可',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '3-3': {
    id: '3-3',
    parentId: '3',
    content: '精华|值得记住',
    level: 2,
    children: [],
    images: [],
    collapsed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['#重点'],
  },
};

export const INITIAL_SIDEBAR_DATA: SidebarItem[] = [
  { id: 'car', title: '汽车是如何跑起来的', emoji: '🏎️' },
  { id: 'plan', title: '我的每日计划', emoji: '📅' },
  { id: 'learning', title: '读书笔记《我们如何学习》', emoji: '📚', isActive: true },
  { id: 'time', title: '读书笔记《时间简史》', emoji: '📚' },
  { id: 'fortress', title: '读书笔记《围城》', emoji: '📚' },
  { id: 'english', title: '考研学习 | 英语', emoji: '✏️' },
  { id: 'cook', title: '厨房秘籍：红烧肉', emoji: '🍱' },
  { id: 'travel', title: '2025旅行计划', emoji: '✈️' },
  { id: 'code', title: 'React 性能优化技巧', emoji: '💻' },
];

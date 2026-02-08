import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

/**
 * 标签管理 Hook
 * 处理节点标签的添加、删除和自动识别
 */
export function useNodeTags(nodeId: string) {
  const node = useEditorStore(s => s.nodes[nodeId]);
  const updateContent = useEditorStore(s => s.updateNodeContent);

  /**
   * 从内容中提取标签
   * 支持格式：#标签名
   */
  const extractTags = useCallback((content: string): string[] => {
    const tagRegex = /#([^\s#]+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const tag = `#${match[1]}`;
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }, []);

  /**
   * 从内容中移除标签文本
   */
  const removeTagsFromContent = useCallback((content: string): string => {
    return content.replace(/#[^\s#]+/g, '').trim();
  }, []);

  /**
   * 添加标签
   */
  const addTag = useCallback(
    (tag: string) => {
      if (!node) return;

      // 确保标签以 # 开头
      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;

      // 检查是否已存在
      if (node.tags?.includes(normalizedTag)) {
        return;
      }

      // 更新节点标签
      const newTags = [...(node.tags || []), normalizedTag];
      useEditorStore.setState(state => {
        if (state.nodes[nodeId]) {
          state.nodes[nodeId].tags = newTags;
        }
      });
    },
    [node, nodeId]
  );

  /**
   * 删除标签
   */
  const removeTag = useCallback(
    (tag: string) => {
      if (!node || !node.tags) return;

      const newTags = node.tags.filter(t => t !== tag);
      useEditorStore.setState(state => {
        if (state.nodes[nodeId]) {
          state.nodes[nodeId].tags = newTags.length > 0 ? newTags : undefined;
        }
      });
    },
    [node, nodeId]
  );

  /**
   * 从内容中自动识别并提取标签
   * 将标签从内容中移除，添加到 tags 数组
   */
  const autoExtractTags = useCallback(() => {
    if (!node) return;

    const tags = extractTags(node.content);
    const contentWithoutTags = removeTagsFromContent(node.content);

    if (tags.length > 0) {
      useEditorStore.setState(state => {
        if (state.nodes[nodeId]) {
          state.nodes[nodeId].tags = tags;
          state.nodes[nodeId].content = contentWithoutTags;
        }
      });
    }
  }, [node, nodeId, extractTags, removeTagsFromContent]);

  /**
   * 切换标签（存在则删除，不存在则添加）
   */
  const toggleTag = useCallback(
    (tag: string) => {
      if (!node) return;

      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;

      if (node.tags?.includes(normalizedTag)) {
        removeTag(normalizedTag);
      } else {
        addTag(normalizedTag);
      }
    },
    [node, addTag, removeTag]
  );

  return {
    tags: node?.tags || [],
    addTag,
    removeTag,
    toggleTag,
    autoExtractTags,
    extractTags,
  };
}


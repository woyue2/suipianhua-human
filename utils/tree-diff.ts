import { OutlineNode, ReorganizeChange } from '@/types';

export function calculateDiff(
  oldTree: OutlineNode,
  newTree: OutlineNode
): ReorganizeChange[] {
  const changes: ReorganizeChange[] = [];

  function traverse(newNode: OutlineNode, path: string[]) {
    const oldLocation = findNodeInTree(oldTree, newNode.content);

    if (oldLocation) {
      if (oldLocation.path.join('/') !== path.join('/')) {
        changes.push({
          type: 'move',
          description: `从 "${oldLocation.path.join('/')}" 移动到此`,
          fromPath: oldLocation.path,
          toPath: path,
        });
      }
    } else {
      changes.push({
        type: 'create_category',
        description: '新建分类',
        fromPath: [],
        toPath: path,
      });
    }

    newNode.children.forEach(child =>
      traverse(child, [...path, newNode.content])
    );
  }

  traverse(newTree, [newTree.content]);
  return changes;
}

function findNodeInTree(
  tree: OutlineNode,
  content: string
): { path: string[] } | null {
  function search(node: OutlineNode, currentPath: string[]): string[] | null {
    if (node.content === content) {
      return currentPath;
    }
    for (const child of node.children) {
      const result = search(child, [...currentPath, node.content]);
      if (result) return result;
    }
    return null;
  }

  return search(tree, []) ? { path: search(tree, []) || [] } : null;
}

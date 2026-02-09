import React, { memo } from 'react';

interface NodeBulletProps {
  hasChildren: boolean;
  onClick: () => void;
}

/**
 * 节点项目符号组件
 * 显示节点的折叠/展开状态
 */
export const NodeBullet = memo(function NodeBullet({
  hasChildren,
  onClick,
}: NodeBulletProps) {
  const bulletClass = hasChildren
    ? 'w-2 h-2 rounded-full mt-2.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-125 bg-primary'
    : 'w-2 h-2 rounded-full mt-2.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-125 bg-slate-300 dark:bg-slate-600';

  return <div onClick={onClick} className={bulletClass} />;
});

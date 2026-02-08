'use client';

import { useState, useEffect } from 'react';
import { ImageAttachment } from '@/types';
import { useEditorStore } from '@/lib/store';

interface NodeImagesProps {
  nodeId: string;
  images: ImageAttachment[];
}

export function NodeImages({ nodeId, images }: NodeImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const removeImage = useEditorStore((s) => s.removeImage);

  // ESC 键关闭预览
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedImage]);

  if (!images || images.length === 0) {
    return null;
  }

  const handleRemoveImage = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张图片吗？')) {
      removeImage(nodeId, imageId);
    }
  };

  return (
    <>
      {/* 图片列表 - 靠左排列，正方形缩略图 */}
      <div className="flex flex-wrap gap-2 mt-2 ml-1">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
          >
            {/* 正方形容器 */}
            <div className="w-32 h-32 rounded border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={image.url}
                alt={image.alt || ''}
                className="w-full h-full object-cover"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                }}
              />
            </div>
            {/* 删除按钮 */}
            <button
              onClick={(e) => handleRemoveImage(image.id, e)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              title="删除图片"
            >
              ×
            </button>
            {image.caption && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center max-w-[128px] truncate">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片预览模态框 - 完整显示，可滚动 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors z-10 text-xl font-bold shadow-lg"
            title="关闭 (ESC)"
          >
            ×
          </button>
          
          {/* 图片容器 - 可滚动查看完整图片 */}
          <div className="relative w-full h-full flex items-start justify-center overflow-auto py-8">
            <img
              src={selectedImage}
              alt="预览"
              className="max-w-none h-auto shadow-2xl"
              style={{ maxHeight: 'none' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

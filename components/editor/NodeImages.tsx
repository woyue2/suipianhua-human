'use client';

import { useState } from 'react';
import { ImageAttachment } from '@/types';
import { useEditorStore } from '@/lib/store';

interface NodeImagesProps {
  nodeId: string;
  images: ImageAttachment[];
}

export function NodeImages({ nodeId, images }: NodeImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const removeImage = useEditorStore((s) => s.removeImage);

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
      {/* 图片列表 - 靠左排列 */}
      <div className="flex flex-wrap gap-2 mt-2 ml-1">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
          >
            <img
              src={image.url}
              alt={image.alt || ''}
              className="max-w-xs max-h-48 rounded border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors object-contain"
              onLoad={(e) => {
                // 图片加载后可以获取实际尺寸
                const img = e.target as HTMLImageElement;
                console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
              }}
            />
            {/* 删除按钮 */}
            <button
              onClick={(e) => handleRemoveImage(image.id, e)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="删除图片"
            >
              ×
            </button>
            {image.caption && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={selectedImage}
              alt="预览"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}


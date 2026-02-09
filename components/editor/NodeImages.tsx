'use client';

import { useState, useEffect } from 'react';
import { ImageAttachment } from '@/types';
import { useEditorStore } from '@/lib/store';
import { toast } from 'sonner';

interface NodeImagesProps {
  nodeId: string;
  images: ImageAttachment[];
}

export function NodeImages({ nodeId, images }: NodeImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const removeImage = useEditorStore((s) => s.removeImage);
  const addImage = useEditorStore((s) => s.addImage);

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

  const handleRemoveImage = (image: ImageAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    removeImage(nodeId, image.id);
    toast('图片已删除', {
      action: {
        label: '撤销',
        onClick: () => {
          addImage(nodeId, image);
        },
      },
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-video rounded border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
          >
            <img
              src={image.url}
              alt={image.alt || ''}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <button
              onClick={(e) => handleRemoveImage(image, e)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              title="删除图片"
            >
              ×
            </button>
            {image.caption && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center truncate px-2">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors z-10 text-xl font-bold shadow-lg"
            title="关闭 (ESC)"
          >
            ×
          </button>
          
          <div className="relative w-full h-full flex items-start justify-center overflow-auto py-8">
            <div className="relative w-[90vw] max-w-5xl aspect-video shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt="预览"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

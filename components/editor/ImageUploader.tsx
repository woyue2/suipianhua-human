'use client';

import { useState, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { ImageAttachment } from '@/types';

interface ImageUploaderProps {
  nodeId: string;
  onUploadComplete?: () => void;
}

export function ImageUploader({ nodeId, onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addImage = useEditorStore((s) => s.addImage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 从 localStorage 获取图床配置
      const configStr = localStorage.getItem('user-config');
      const config = configStr ? JSON.parse(configStr) : null;
      
      if (!config?.imageUpload?.apiKey) {
        throw new Error('请先在设置中配置图床 API Key');
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {
        'x-image-provider': config.imageUpload.provider || 'imgur',
        'x-image-api-key': config.imageUpload.apiKey,
      };
      
      if (config.imageUpload.customUrl) {
        headers['x-image-custom-url'] = config.imageUpload.customUrl;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      // 创建图片附件对象
      const imageAttachment: ImageAttachment = {
        id: crypto.randomUUID(),
        url: result.url,
        width: 0, // 实际宽高可以在图片加载后获取
        height: 0,
        uploadedAt: Date.now(),
      };

      // 添加到节点
      addImage(nodeId, imageAttachment);
      
      // 清空输入
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      onUploadComplete?.();
    } catch (err: any) {
      console.error('上传失败:', err);
      setError(err?.message || '上传失败');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
      <button
        onClick={handleClick}
        disabled={uploading}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
        title={uploading ? '上传中...' : '上传图片'}
      >
        {uploading ? (
          <span className="text-lg animate-spin inline-block">⏳</span>
        ) : (
          <span className="text-lg">🖼️</span>
        )}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400 whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg z-50">
          {error}
        </div>
      )}
    </>
  );
}


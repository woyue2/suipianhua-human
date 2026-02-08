'use client';

import { useState, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { ImageAttachment } from '@/types';
import { toastSuccess, toastError } from '@/lib/toast';

interface ImageUploaderProps {
  nodeId: string;
  onUploadComplete?: () => void;
}

/**
 * 压缩图片到指定大小以内
 * @param file 原始文件
 * @param maxSize 最大文件大小（字节），默认 1MB
 * @param maxWidth 最大宽度，默认 1920
 * @param quality 初始质量，默认 0.9
 */
async function compressImage(
  file: File,
  maxSize: number = 1 * 1024 * 1024, // 1MB
  maxWidth: number = 1920,
  quality: number = 0.9
): Promise<File> {
  // 如果文件已经小于最大尺寸，直接返回
  if (file.size <= maxSize) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'));
        return;
      }

      // 计算缩放比例（保持宽高比）
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height);

      // 逐步降低质量直到文件大小满足要求
      let currentQuality = quality;
      const minQuality = 0.1;
      const qualityStep = 0.1;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            // 如果文件大小符合要求，或质量已降到最低
            if (blob.size <= maxSize || currentQuality <= minQuality) {
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            } else {
              // 继续降低质量
              currentQuality -= qualityStep;
              tryCompress();
            }
          },
          'image/jpeg',
          currentQuality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
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
      // 压缩图片到 1MB 以内
      const compressedFile = await compressImage(file, 1 * 1024 * 1024);

      // 显示压缩信息
      if (compressedFile.size < file.size) {
        const originalMB = (file.size / 1024 / 1024).toFixed(2);
        const compressedMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`图片已压缩: ${originalMB}MB → ${compressedMB}MB`);
      }

      // 从 localStorage 获取图床配置（可选）
      const configStr = localStorage.getItem('user-config');
      const config = configStr ? JSON.parse(configStr) : null;

      const formData = new FormData();
      formData.append('file', compressedFile);

      const headers: Record<string, string> = {};

      // 如果用户配置了图床，使用用户配置
      if (config?.imageUpload) {
        headers['x-image-provider'] = config.imageUpload.provider || 'imgur';
        if (config.imageUpload.apiKey) {
          headers['x-image-api-key'] = config.imageUpload.apiKey;
        }
        if (config.imageUpload.customUrl) {
          headers['x-image-custom-url'] = config.imageUpload.customUrl;
        }
      }
      // 否则服务端会使用环境变量中的 API Key

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
        url: result.data.url, // 修复：应该是 data.url
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

      // 显示成功提示
      toastSuccess('图片上传成功');

      onUploadComplete?.();
    } catch (err: any) {
      console.error('上传失败:', err);
      const errorMsg = err?.message || '上传失败';
      setError(errorMsg);
      toastError(errorMsg);
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


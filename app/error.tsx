'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          出错了！
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error.message || '应用遇到了一个错误'}
        </p>
        <button
          onClick={reset}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}


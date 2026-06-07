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
    console.error('应用错误:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">⚠️</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          出现了一些问题
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || '未知错误'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}

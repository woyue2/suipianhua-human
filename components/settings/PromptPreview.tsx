'use client';

import { SystemPromptTemplate } from '@/lib/prompts/types';

interface PromptPreviewProps {
  prompt: SystemPromptTemplate;
  onClose: () => void;
}

export default function PromptPreview({ prompt, onClose }: PromptPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium">{prompt.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">描述</h4>
              <p>{prompt.description}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">分类</h4>
              <span className="inline-block px-2 py-1 text-sm bg-gray-100 rounded">
                {prompt.category}
              </span>
            </div>

            {prompt.scenario && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">适合场景</h4>
                <p>{prompt.scenario}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">系统提示词</h4>
              <pre className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {prompt.systemPrompt}
              </pre>
            </div>

            {prompt.temperature !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Temperature</h4>
                <p>{prompt.temperature}</p>
              </div>
            )}

            {prompt.outputFormat && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">输出格式</h4>
                <p>{prompt.outputFormat}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

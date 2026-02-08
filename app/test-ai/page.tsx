
'use client';

import React, { useState } from 'react';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestAIPage() {
  const [input, setInput] = useState(
    '完成项目报告 #urgent @manager 下周一之前\n购买牛奶和面包 #shopping\n[Idea] 开发一个新的 AI 插件用于自动分类'
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/reorganize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('分析完成');
    } catch (error) {
      console.error(error);
      toast.error('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI 智能整理测试</h1>
        <p className="text-gray-500">
          测试 AI 对行内内容的语义识别与重组能力。
          输入多行文本，AI 将尝试识别其中的任务、时间、标签、人员等信息。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">输入内容</h2>
            <button
              onClick={() => setInput('')}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              清空
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            placeholder="在此输入待整理的文本..."
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="w-full py-3 bg-black text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                正在分析...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                开始分析
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">分析结果</h2>
          <div className="w-full h-[400px] border rounded-lg shadow-sm bg-gray-50 overflow-y-auto p-4">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p>暂无结果，请点击左侧按钮开始分析</p>
              </div>
            )}
            
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                <p>正在请求 AI 模型...</p>
              </div>
            )}

            {result && result.analysis && (
              <div className="space-y-6">
                {result.analysis.map((item: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider flex justify-between">
                      <span>Original Line {index + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.action === 'split' ? 'bg-orange-100 text-orange-600' :
                        item.action === 'extract_metadata' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.action}
                      </span>
                    </div>
                    <div className="text-gray-800 font-medium mb-3 pb-2 border-b border-gray-50">
                      {item.originalLine}
                    </div>
                    
                    {/* Segments Visualization */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.segments.map((seg: any, i: number) => (
                        <span 
                          key={i} 
                          className={`px-2 py-1 rounded text-xs border flex items-center gap-1
                            ${seg.type === 'task' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              seg.type === 'date' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              seg.type === 'tag' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                              seg.type === 'person' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                        >
                          {seg.text}
                          <span className="opacity-50 text-[10px] ml-1">.{seg.type}</span>
                        </span>
                      ))}
                    </div>

                    {/* Reorganized Suggestion */}
                    <div className="bg-gray-50 p-2 rounded text-sm text-gray-600">
                      <div className="text-[10px] text-gray-400 mb-1">SUGGESTED REORGANIZATION</div>
                      {item.reorganized.map((rec: any, k: number) => (
                        <div key={k} className="flex flex-col gap-1">
                          <div className="flex gap-2 items-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <div className="text-gray-900 font-medium">{rec.content}</div>
                          </div>
                          {rec.attributes && Object.keys(rec.attributes).length > 0 && (
                            <div className="pl-6 flex flex-wrap gap-2">
                              {Object.entries(rec.attributes).map(([key, value]) => (
                                <span key={key} className="text-xs bg-white px-1.5 py-0.5 border rounded text-gray-500">
                                  <span className="opacity-50 mr-1">{key}:</span>
                                  {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {result && !result.analysis && (
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

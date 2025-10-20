/**
 * QuickPlacement v1.1 API 测试页面
 * 简化路径版本，避免路由问题
 */

'use client';

import React, { useState } from 'react';

export default function QuickPlacementTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 测试题目 API
      const questionsResponse = await fetch('/api/placement/questions?locale=zh');
      const questionsData = await questionsResponse.json();

      // 测试评估 API
      const evaluateResponse = await fetch('/api/placement/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: 'zh',
          user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          scene_tags: ['a1_basic_greeting_info', 'a1_confirm_single_step'],
          objective_score: 0,
          self_assessed_level: 'A2',
          track_hint: 'daily'
        }),
      });

      const evaluateData = await evaluateResponse.json();

      setResult({
        questions: questionsData,
        evaluation: evaluateData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API 测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  const testQuestionsAPI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/placement/questions?locale=zh');
      const data = await response.json();
      setResult({ questions: data, timestamp: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : '题目 API 测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  const isDataSafe = (data: any) => {
    const dataStr = JSON.stringify(data);
    const sensitiveFields = ['correct', 'scored', 'level_hint', 'answer'];

    for (const field of sensitiveFields) {
      if (dataStr.includes(field)) {
        return { safe: false, field };
      }
    }

    return { safe: true };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            QuickPlacement v1.1 API 测试
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            测试防泄题和 API 功能
          </p>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API 测试</h2>

          <div className="space-y-4">
            <button
              onClick={testQuestionsAPI}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? '测试中...' : '测试题目 API'}
            </button>

            <button
              onClick={testAPI}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? '测试中...' : '完整 API 测试'}
            </button>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <h3 className="text-red-800 font-semibold mb-2">❌ 测试失败</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">测试结果</h2>

            {/* 安全检查 */}
            {result.questions && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">🔒 防泄题检查</h3>
                {(() => {
                  const safety = isDataSafe(result.questions);
                  return safety.safe ? (
                    <p className="text-green-700">✅ 通过 - 未检测到敏感字段泄露</p>
                  ) : (
                    <p className="text-red-700">❌ 失败 - 检测到敏感字段: {safety.field}</p>
                  );
                })()}
              </div>
            )}

            {/* 详细数据 */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">API 响应数据</h3>
              <pre className="text-xs text-gray-600 overflow-auto max-h-96 bg-white p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-800 mb-2">📋 测试说明</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• <strong>题目 API</strong>: 测试 /api/placement/questions 接口</li>
            <li>• <strong>完整测试</strong>: 测试题目和评估接口</li>
            <li>• <strong>防泄题检查</strong>: 验证响应中不包含敏感字段</li>
            <li>• <strong>影子模式</strong>: 当前运行在安全调试模式</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
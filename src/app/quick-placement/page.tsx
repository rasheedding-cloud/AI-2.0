/**
 * QuickPlacement v1 测试页面
 */

'use client';

import React, { useState } from 'react';
import { QuickPlacement } from '@/components/QuickPlacement';
import { QuickPlacementResponse } from '@/types/placement';

export default function QuickPlacementPage() {
  const [locale, setLocale] = useState<'zh' | 'en' | 'ar'>('zh');
  const [trackHint, setTrackHint] = useState<'daily' | 'work' | 'travel' | 'academic' | undefined>('daily');
  const [result, setResult] = useState<QuickPlacementResponse | null>(null);
  const [showComponent, setShowComponent] = useState(true);

  const handleComplete = (placementResult: QuickPlacementResponse) => {
    setResult(placementResult);
    setShowComponent(false);
  };

  const handleSkip = () => {
    console.log('用户跳过快测');
    setShowComponent(false);
  };

  const handleRestart = () => {
    setResult(null);
    setShowComponent(true);
  };

  const isRTL = locale === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className=\"max-w-6xl mx-auto px-4\">
        {/* 页面标题和配置 */}
        <div className=\"text-center mb-8\">
          <h1 className=\"text-4xl font-bold text-gray-900 mb-2\">
            QuickPlacement v1 测试
          </h1>
          <p className=\"text-xl text-gray-600 mb-6\">
            3分钟英语水平快测系统
          </p>

          {/* 配置选项 */}
          {showComponent && (
            <div className=\"bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto\">
              <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">测试配置</h2>

              <div className=\"grid md:grid-cols-2 gap-6\">
                {/* 语言选择 */}
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    界面语言
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as 'zh' | 'en' | 'ar')}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                  >
                    <option value=\"zh\">中文</option>
                    <option value=\"en\">English</option>
                    <option value=\"ar\">العربية</option>
                  </select>
                </div>

                {/* 学习轨道提示 */}
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    学习轨道提示（可选）
                  </label>
                  <select
                    value={trackHint || ''}
                    onChange={(e) => setTrackHint(e.target.value ? e.target.value as any : undefined)}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                  >
                    <option value=\"\">无提示</option>
                    <option value=\"daily\">日常英语</option>
                    <option value=\"work\">职场英语</option>
                    <option value=\"travel\">旅行英语</option>
                    <option value=\"academic\">学术英语</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QuickPlacement 组件 */}
        {showComponent ? (
          <QuickPlacement
            locale={locale}
            trackHint={trackHint}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        ) : (
          <div className=\"text-center\">
            {/* 结果显示 */}
            {result && (
              <div className=\"bg-white rounded-lg shadow-md p-8 mb-8 max-w-4xl mx-auto\">
                <h2 className=\"text-2xl font-bold text-gray-900 mb-4\">测试结果</h2>
                <div className=\"grid md:grid-cols-2 gap-6 text-left\">
                  <div>
                    <h3 className=\"font-semibold text-gray-700 mb-2\">基本信息</h3>
                    <p><strong>评估等级:</strong> {result.mapped_start}</p>
                    <p><strong>置信度:</strong> {Math.round(result.confidence * 100)}%</p>
                    <p><strong>界面语言:</strong> {locale}</p>
                    <p><strong>题目数量:</strong> {result.metadata.question_count}</p>
                  </div>
                  <div>
                    <h3 className=\"font-semibold text-gray-700 mb-2\">客观题表现</h3>
                    <p><strong>正确题数:</strong> {result.breakdown.objective_score.correct}/{result.breakdown.objective_score.total}</p>
                    <p><strong>正确率:</strong> {Math.round(result.breakdown.objective_score.accuracy * 100)}%</p>
                    <p><strong>自评等级:</strong> {result.breakdown.self_assessment || '未提供'}</p>
                  </div>
                </div>

                {/* 诊断信息 */}
                <div className=\"mt-6 text-left\">
                  <h3 className=\"font-semibold text-gray-700 mb-2\">能力诊断</h3>
                  <div className=\"grid md:grid-cols-3 gap-4 text-sm\">
                    <div>
                      <strong>较强技能:</strong>
                      <ul className=\"text-gray-600 mt-1\">
                        {result.diagnostic.stronger_skills.map((skill, index) => (
                          <li key={index}>• {skill}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>较弱技能:</strong>
                      <ul className=\"text-gray-600 mt-1\">
                        {result.diagnostic.weaker_skills.map((skill, index) => (
                          <li key={index}>• {skill}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>建议重点:</strong>
                      <ul className=\"text-gray-600 mt-1\">
                        {result.diagnostic.recommended_focus.map((focus, index) => (
                          <li key={index}>• {focus}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 详细数据 */}
                <div className=\"mt-6 text-left bg-gray-50 p-4 rounded\">
                  <h3 className=\"font-semibold text-gray-700 mb-2\">详细数据（JSON）</h3>
                  <pre className=\"text-xs text-gray-600 overflow-auto max-h-64 bg-white p-3 rounded border\">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 重新开始按钮 */}
            <button
              onClick={handleRestart}
              className=\"px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg\"
            >
              重新测试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
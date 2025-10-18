'use client';

import { useEffect, useState } from 'react';
import { isDynamicGatesUIEnabled } from '@/lib/client/features';
import { getFeatureFlagsSummary } from '@/lib/features/dynamicGates';
import { MILESTONE_V2_FEATURES } from '@/lib/learning/milestones_v2';

export default function TestFeaturesPage() {
  const [clientFeatures, setClientFeatures] = useState<any>(null);
  const [serverFeatures, setServerFeatures] = useState<any>(null);
  const [milestoneFeatures, setMilestoneFeatures] = useState<any>(null);

  useEffect(() => {
    // 客户端功能开关
    setClientFeatures({
      isDynamicGatesUIEnabled: isDynamicGatesUIEnabled(),
      envVar: process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI,
    });

    // 服务器端功能开关
    setServerFeatures(getFeatureFlagsSummary());

    // 里程碑V2功能开关
    setMilestoneFeatures({
      FEATURE_MILESTONES_V2: MILESTONE_V2_FEATURES.FEATURE_MILESTONES_V2,
      MILESTONES_SHADOW: MILESTONE_V2_FEATURES.MILESTONES_SHADOW,
      envVar: process.env.FEATURE_MILESTONES_V2,
    });

    // 调试输出
    console.log('=== 功能开关测试页面 ===');
    console.log('环境变量 FEATURE_MILESTONES_V2:', process.env.FEATURE_MILESTONES_V2);
    console.log('环境变量 FEATURE_DYNAMIC_GATES:', process.env.FEATURE_DYNAMIC_GATES);
    console.log('环境变量 FEATURE_DYNAMIC_GATES_UI:', process.env.FEATURE_DYNAMIC_GATES_UI);
    console.log('环境变量 NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI:', process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI);
    console.log('MILESTONE_V2_FEATURES:', MILESTONE_V2_FEATURES);
    console.log('客户端功能开关:', { isDynamicGatesUIEnabled: isDynamicGatesUIEnabled() });
    console.log('服务器端功能开关:', getFeatureFlagsSummary());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 功能开关测试页面</h1>

        <div className="space-y-6">
          {/* 客户端功能开关 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">客户端功能开关</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>动态门限UI:</span>
                <span className={`font-semibold ${clientFeatures?.isDynamicGatesUIEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {clientFeatures?.isDynamicGatesUIEnabled ? '✅ 启用' : '❌ 禁用'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                环境变量: {clientFeatures?.envVar || 'undefined'}
              </div>
            </div>
          </div>

          {/* 服务器端功能开关 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">服务器端功能开关</h2>
            {serverFeatures && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>动态门限:</span>
                  <span className={`font-semibold ${serverFeatures.dynamicGates ? 'text-green-600' : 'text-red-600'}`}>
                    {serverFeatures.dynamicGates ? '✅ 启用' : '❌ 禁用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>影子模式:</span>
                  <span className={`font-semibold ${serverFeatures.shadowMode ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {serverFeatures.shadowMode ? '📊 影子模式' : '➖ 关闭'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>UI增强:</span>
                  <span className={`font-semibold ${serverFeatures.uiEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {serverFeatures.uiEnabled ? '✅ 启用' : '❌ 禁用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>运行模式:</span>
                  <span className="font-semibold text-blue-600">{serverFeatures.mode}</span>
                </div>
              </div>
            )}
          </div>

          {/* 里程碑V2功能开关 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">里程碑V2功能开关</h2>
            {milestoneFeatures && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>里程碑V2:</span>
                  <span className={`font-semibold ${milestoneFeatures.FEATURE_MILESTONES_V2 ? 'text-green-600' : 'text-red-600'}`}>
                    {milestoneFeatures.FEATURE_MILESTONES_V2 ? '✅ 启用' : '❌ 禁用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>影子模式:</span>
                  <span className={`font-semibold ${milestoneFeatures.MILESTONES_SHADOW ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {milestoneFeatures.MILESTONES_SHADOW ? '📊 影子模式' : '➖ 关闭'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  环境变量: {milestoneFeatures.envVar || 'undefined'}
                </div>
              </div>
            )}
          </div>

          {/* 功能说明 */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">功能说明</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>动态门限UI:</strong> 显示带注解的评估标准和自测功能</p>
              <p><strong>里程碑V2:</strong> 个性化里程碑内容和可观察成果</p>
              <p><strong>影子模式:</strong> 记录但不应用新逻辑，用于对比测试</p>
            </div>
          </div>

          {/* 测试建议 */}
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">测试建议</h3>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>1. 检查浏览器控制台查看详细调试信息</p>
              <p>2. 访问学习计划页面查看是否显示动态门限UI</p>
              <p>3. 验证里程碑是否显示个性化内容和可观察成果</p>
              <p>4. 如果功能未启用，请检查Vercel环境变量配置</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/plans"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往学习计划页面测试
          </a>
        </div>
      </div>
    </div>
  );
}
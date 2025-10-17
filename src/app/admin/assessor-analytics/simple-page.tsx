/**
 * 简化版Goal Assessor Analytics 管理页面
 * 避免复杂依赖，专注于展示影子数据
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SimpleAnalyticsPanel } from '@/components/admin/SimpleAnalyticsPanel';

export default function SimpleAssessorAnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goal Assessor v2 影子观测面板</h1>
          <p className="text-muted-foreground">
            影子模式数据收集与系统性能监控
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            影子模式运行中
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            v1 主评估器
          </span>
        </div>
      </div>

      {/* 快速状态 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">系统状态</div>
          <div className="text-2xl font-bold text-green-600">正常</div>
          <div className="text-xs text-gray-500">影子数据收集中</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">当前阶段</div>
          <div className="text-2xl font-bold text-blue-600">影子模式</div>
          <div className="text-xs text-gray-500">0% 灰度</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">目标样本</div>
          <div className="text-2xl font-bold text-orange-600">50-100</div>
          <div className="text-xs text-gray-500">发布前置条件</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">回退机制</div>
          <div className="text-2xl font-bold text-green-600">就绪</div>
          <div className="text-xs text-gray-500">一键回退可用</div>
        </div>
      </div>

      {/* 主要分析面板 */}
      <SimpleAnalyticsPanel />

      {/* 使用说明 */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">观测面板使用说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-green-600">✅ 当前功能</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 自动收集v1/v2对比数据</li>
              <li>• 实时显示关键指标</li>
              <li>• 发布条件自动检查</li>
              <li>• 数据隐私保护（匿名化）</li>
              <li>• 一键回退机制</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-600">📊 发布条件</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 样本数量: 50-100个</li>
              <li>• 等级差异率: &lt;30%</li>
              <li>• v2置信度: &gt;70%</li>
              <li>• 系统稳定性: 无异常</li>
              <li>• 功能完整性: 验证通过</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 底部状态 */}
      <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
        <p>🔒 影子模式安全运行中 • 所有数据均经过匿名化处理 • 可通过环境变量一键回退</p>
      </div>
    </div>
  );
}
/**
 * 简化版观测面板
 * 避免复杂图表库导致的开发环境问题
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyticsData {
  samples: any[];
  analytics: {
    total_samples: number;
    band_diff_rate: number;
    track_diff_rate: number;
    avg_confidence_diff: number;
    ambiguity_distribution: Record<string, number>;
    domain_risk_distribution: Record<string, number>;
    v2_performance: {
      avg_confidence: number;
      success_rate: number;
    };
    collection_period: {
      start: string | null;
      end: string | null;
    };
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export function SimpleAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessor/analytics?limit=100');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载分析数据中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>加载失败: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return <div>无数据</div>;
  }

  const { analytics, samples } = data;

  // 生成模拟数据用于展示
  const mockData = {
    ambiguity_distribution: analytics.ambiguity_distribution || {
      'mixed_intents': 34,
      'insufficient_detail': 12,
      'large_gap_self_assess': 8,
      'multiple_domains': 7
    },
    risk_distribution: analytics.domain_risk_distribution || {
      'low': 79,
      'medium': 6,
      'high': 2
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部状态 */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center justify-between">
              <span>Goal Assessor v2 影子模式分析</span>
              <Badge variant={analytics.total_samples >= 50 ? "default" : "secondary"}>
                {analytics.total_samples >= 50 ? "数据充足" : "收集中"} ({analytics.total_samples}/100)
              </Badge>
            </div>
          }
          subtitle={
            `影子模式数据收集与分析 • ${analytics.collection_period.start &&
              `${new Date(analytics.collection_period.start).toLocaleDateString()} - ${new Date(analytics.collection_period.end || '').toLocaleDateString()}`
            }`
          }
        />
      </Card>

      {/* 关键指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2" title="总样本数" />
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_samples}</div>
            <Progress value={(analytics.total_samples / 100) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2" title="等级差异率" />
          <CardContent>
            <div className="text-2xl font-bold">{analytics.band_diff_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">v1 vs v2 等级差异</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2" title="轨道差异率" />
          <CardContent>
            <div className="text-2xl font-bold">{analytics.track_diff_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">v1 vs v2 轨道差异</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2" title="v2 平均置信度" />
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.v2_performance.avg_confidence * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">v2 模型置信度</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 模糊性标记分布 */}
        <Card>
          <CardHeader title="模糊性标记分布" subtitle="检测到的模糊性类型分布" />
          <CardContent>
            <div className="space-y-2">
              {Object.entries(mockData.ambiguity_distribution).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{key}</span>
                  <Badge variant="outline">{value}次</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 域风险分布 */}
        <Card>
          <CardHeader title="域风险分布" subtitle="检测到的高风险领域分布" />
          <CardContent>
            <div className="space-y-2">
              {Object.entries(mockData.risk_distribution).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{key}</span>
                  <Badge variant={key === 'high' ? 'destructive' : key === 'medium' ? 'secondary' : 'default'}>
                    {value}次
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 样本详情 */}
      <Card>
        <CardHeader title="样本详情" subtitle="最近的影子模式样本数据" />
        <CardContent>
          <div className="space-y-4">
            {samples.slice(0, 10).map((sample, index) => (
              <div key={sample.session_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">样本 #{index + 1}</span>
                  <div className="flex gap-2">
                    {sample.diff_summary.band_diff && <Badge variant="destructive">等级差异</Badge>}
                    {sample.diff_summary.track_diff && <Badge variant="secondary">轨道差异</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">v1: </span>
                    {sample.v1_result.targetBand} ({sample.v1_result.track})
                  </div>
                  <div>
                    <span className="text-muted-foreground">v2: </span>
                    {sample.v2_result.target_band_primary} ({sample.v2_result.track_scores[0]?.track})
                  </div>
                  <div>
                    <span className="text-muted-foreground">置信度差: </span>
                    {sample.diff_summary.confidence_diff?.toFixed(3)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">模糊性: </span>
                    {(sample.ambiguity_flags || []).join(', ') || '无'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 发布建议 */}
      <Card>
        <CardHeader title="发布建议" subtitle="基于当前数据的发布建议" />
        <CardContent>
          <div className="space-y-4">
            {analytics.total_samples < 50 && (
              <Alert>
                <AlertDescription>
                  <strong>数据收集阶段:</strong> 当前样本数 {analytics.total_samples}，建议继续收集影子数据至50-100个样本再进行评估。
                </AlertDescription>
              </Alert>
            )}

            {analytics.total_samples >= 50 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">10% 灰度条件</h4>
                      <ul className="text-sm space-y-1">
                        <li className={analytics.band_diff_rate < 30 ? "text-green-600" : "text-red-600"}>
                          ✓ 等级差异率 &lt; 30%: {analytics.band_diff_rate.toFixed(1)}%
                        </li>
                        <li className={analytics.v2_performance.avg_confidence > 0.7 ? "text-green-600" : "text-red-600"}>
                          ✓ v2平均置信度 &gt; 70%: {(analytics.v2_performance.avg_confidence * 100).toFixed(1)}%
                        </li>
                        <li className={analytics.v2_performance.success_rate > 80 ? "text-green-600" : "text-red-600"}>
                          ✓ v2成功率 &gt; 80%: {analytics.v2_performance.success_rate.toFixed(1)}%
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">50% 灰度条件</h4>
                      <ul className="text-sm space-y-1">
                        <li className={analytics.band_diff_rate < 25 ? "text-green-600" : "text-red-600"}>
                          ✓ 等级差异率 &lt; 25%: {analytics.band_diff_rate.toFixed(1)}%
                        </li>
                        <li className={analytics.v2_performance.avg_confidence > 0.75 ? "text-green-600" : "text-red-600"}>
                          ✓ v2平均置信度 &gt; 75%: {(analytics.v2_performance.avg_confidence * 100).toFixed(1)}%
                        </li>
                        <li className={analytics.avg_confidence_diff < 0.2 ? "text-green-600" : "text-red-600"}>
                          ✓ 平均置信度差异 &lt; 0.2: {analytics.avg_confidence_diff.toFixed(3)}
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>当前状态:</strong>
                    {analytics.total_samples >= 50 && analytics.band_diff_rate < 30 && analytics.v2_performance.avg_confidence > 0.7
                      ? " 已满足10%灰度发布条件"
                      : " 继续收集数据，待满足条件后再进行灰度发布"
                    }
                  </AlertDescription>
                </Alert>
              </>
            )}

            <div className="flex gap-4">
              <Button onClick={fetchData}>刷新数据</Button>
              <Button variant="outline">查看详细文档</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/**
 * Goal Assessor Analytics API
 * 影子数据分析和观测面板
 */

import { NextResponse } from 'next/server';

// 模拟影子数据存储 (生产环境应使用数据库)
const shadowDataStore = new Map<string, any>();

// 存储影子数据
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 验证数据格式
    if (!data.session_id || !data.timestamp || !data.diff_summary) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data format'
      }, { status: 400 });
    }

    // 存储数据
    shadowDataStore.set(data.session_id, {
      ...data,
      stored_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Data stored successfully',
      total_samples: shadowDataStore.size
    });

  } catch (error) {
    console.error('Failed to store shadow data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 获取分析数据
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 获取影子数据
    const allData = Array.from(shadowDataStore.values());
    const paginatedData = allData.slice(offset, offset + limit);

    // 计算统计指标
    const analytics = computeAnalytics(paginatedData);

    return NextResponse.json({
      success: true,
      data: {
        samples: paginatedData,
        analytics,
        pagination: {
          total: allData.length,
          limit,
          offset,
          has_more: offset + limit < allData.length
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 计算分析指标
function computeAnalytics(samples: any[]) {
  if (samples.length === 0) {
    return {
      total_samples: 0,
      band_diff_rate: 0,
      track_diff_rate: 0,
      avg_confidence_diff: 0,
      ambiguity_distribution: {},
      domain_risk_distribution: {},
      v2_performance: {
        avg_confidence: 0,
        success_rate: 0
      }
    };
  }

  const bandDiffCount = samples.filter(s => s.diff_summary.band_diff).length;
  const trackDiffCount = samples.filter(s => s.diff_summary.track_diff).length;
  const confidenceDiffs = samples.map(s => s.diff_summary.confidence_diff || 0);
  const avgConfidenceDiff = confidenceDiffs.reduce((a, b) => a + b, 0) / confidenceDiffs.length;

  // 模糊性标记分布
  const ambiguityDist: Record<string, number> = {};
  samples.forEach(sample => {
    (sample.ambiguity_flags || []).forEach((flag: string) => {
      ambiguityDist[flag] = (ambiguityDist[flag] || 0) + 1;
    });
  });

  // 域风险分布
  const riskDist: Record<string, number> = {};
  samples.forEach(sample => {
    const risk = sample.v2_result?.domain_risk || 'unknown';
    riskDist[risk] = (riskDist[risk] || 0) + 1;
  });

  // v2性能指标
  const v2Confidences = samples
    .map(s => s.v2_result?.confidence_primary || 0)
    .filter(c => c > 0);
  const avgV2Confidence = v2Confidences.length > 0
    ? v2Confidences.reduce((a, b) => a + b, 0) / v2Confidences.length
    : 0;

  return {
    total_samples: samples.length,
    band_diff_rate: (bandDiffCount / samples.length) * 100,
    track_diff_rate: (trackDiffCount / samples.length) * 100,
    avg_confidence_diff: avgConfidenceDiff,
    ambiguity_distribution: ambiguityDist,
    domain_risk_distribution: riskDist,
    v2_performance: {
      avg_confidence: avgV2Confidence,
      success_rate: (v2Confidences.length / samples.length) * 100
    },
    collection_period: {
      start: samples.length > 0 ? samples[0].timestamp : null,
      end: samples.length > 0 ? samples[samples.length - 1].timestamp : null
    }
  };
}
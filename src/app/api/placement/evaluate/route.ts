/**
 * QuickPlacement v1 - 评估API路由
 * POST /api/placement/evaluate
 */

import { NextRequest, NextResponse } from 'next/server';
import { performQuickPlacement, shadowModeEvaluation, QuickPlacementConfig } from '@/server/services/placement/quick_placement';
import { QuickPlacementRequestSchema, QuickPlacementResponseSchema, ShadowModeResponseSchema, ApiResponseSchema } from '@/types/placement';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 解析请求体
    const body = await request.json();
    const validatedRequest = QuickPlacementRequestSchema.parse(body);

    // 检查功能特性开关
    const quickPlacementEnabled = process.env.FEATURE_QUICK_PLACEMENT === 'true';
    if (!quickPlacementEnabled) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: '快测功能暂未开放'
        },
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      }, { status: 503 });
    }

    // 检查影子模式
    const shadowModeEnabled = process.env.FEATURE_PLACEMENT_SHADOW_MODE === 'true';

    if (shadowModeEnabled) {
      // 影子模式：并行运行新旧算法
      const shadowResult = await shadowModeEvaluation(validatedRequest);

      const validatedShadowResult = ShadowModeResponseSchema.parse({
        ...shadowResult,
        shadow_mode_enabled: true
      });

      return NextResponse.json({
        success: true,
        data: validatedShadowResult,
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      });
    } else {
      // 正常模式：只使用新算法
      const config: Partial<QuickPlacementConfig> = {
        enable_fusion: process.env.FEATURE_PLACEMENT_FUSION !== 'false',
        fusion_objective_weight: parseFloat(process.env.PLACEMENT_OBJECTIVE_WEIGHT || '0.7'),
        fusion_self_weight: parseFloat(process.env.PLACEMENT_SELF_WEIGHT || '0.3')
      };

      const result = await performQuickPlacement(validatedRequest, config);

      const validatedResult = QuickPlacementResponseSchema.parse({
        ...result,
        metadata: {
          ...result.metadata,
          version: 'v1'
        }
      });

      return NextResponse.json({
        success: true,
        data: validatedResult,
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      });
    }

  } catch (error) {
    console.error('Placement evaluation API error:', error);

    // 处理Zod验证错误
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据格式错误',
          details: error.message
        },
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

/**
 * GET方法：获取当前配置和状态信息
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const config = {
      features: {
        quick_placement_enabled: process.env.FEATURE_QUICK_PLACEMENT === 'true',
        shadow_mode_enabled: process.env.FEATURE_PLACEMENT_SHADOW_MODE === 'true',
        self_assessment_fusion_enabled: process.env.FEATURE_PLACEMENT_FUSION !== 'false'
      },
      weights: {
        objective: parseFloat(process.env.PLACEMENT_OBJECTIVE_WEIGHT || '0.7'),
        self_assessment: parseFloat(process.env.PLACEMENT_SELF_WEIGHT || '0.3')
      },
      settings: {
        time_limit_seconds: 180,
        question_count: 10,
        supported_locales: ['zh', 'en', 'ar']
      }
    };

    return NextResponse.json({
      success: true,
      data: config,
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Placement config API error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      },
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime
      }
    }, { status: 500 });
  }
}
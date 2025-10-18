/**
 * QuickPlacement v1 - 评估API路由
 * POST /api/placement/evaluate
 */

import { NextRequest, NextResponse } from 'next/server';
import { performQuickPlacement, shadowModeEvaluation, QuickPlacementConfig } from '@/server/services/placement/quick_placement';
import { quickPlacementV1_1, shadowModeComparison } from '@/server/services/placement/quick_placement_v1_1';
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

    // 检查v1.1功能开关
    const v1_1Enabled = process.env.FEATURE_QP_V1_1 === 'true';
    const shadowModeEnabled = process.env.QP_SHADOW === 'true';

    if (shadowModeEnabled) {
      // 影子模式：并行运行v1和v1.1算法
      const v1Result = await performQuickPlacement(validatedRequest, {
        v1_1_enabled: false
      });

      // 转换v1请求格式到v1.1格式
      const v1_1Request = {
        locale: validatedRequest.locale,
        user_answers: validatedRequest.user_answers || [],
        scene_tags: validatedRequest.scene_tags || [],
        objective_score: validatedRequest.objective_score,
        self_assessed_level: validatedRequest.self_assessed_level,
        track_hint: validatedRequest.track_hint
      };

      const v1_1Result = quickPlacementV1_1(v1_1Request);

      const shadowComparisonData = shadowModeComparison(v1_1Request, v1Result, v1_1Result);

      return NextResponse.json({
        success: true,
        data: {
          shadow_mode_enabled: true,
          shadow_comparison: shadowComparisonData,
          // 返回v1结果用于UI显示
          ...v1Result,
          // 同时包含v1.1的额外字段用于分析
          v1_1_analysis: {
            mapped_start_band: v1_1Result.mapped_start_band,
            band_distribution: v1_1Result.band_distribution,
            flags: v1_1Result.flags,
            evidence_phrases: v1_1Result.evidence_phrases,
            rationale: v1_1Result.rationale
          }
        },
        metadata: {
          version: 'v1.1_shadow',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      });
    } else {
      let result;

      if (v1_1Enabled) {
        // v1.1模式：使用新的三信号融合算法
        const v1_1Request = {
          locale: validatedRequest.locale,
          user_answers: validatedRequest.user_answers || [],
          scene_tags: validatedRequest.scene_tags || [],
          objective_score: validatedRequest.objective_score,
          self_assessed_level: validatedRequest.self_assessed_level,
          track_hint: validatedRequest.track_hint
        };

        result = quickPlacementV1_1(v1_1Request);
      } else {
        // v1模式：使用原有算法
        const config: Partial<QuickPlacementConfig> = {
          enable_fusion: process.env.FEATURE_PLACEMENT_FUSION !== 'false',
          fusion_objective_weight: parseFloat(process.env.PLACEMENT_OBJECTIVE_WEIGHT || '0.7'),
          fusion_self_weight: parseFloat(process.env.PLACEMENT_SELF_WEIGHT || '0.3')
        };

        result = await performQuickPlacement(validatedRequest, config);
      }

      // 验证并添加版本信息
      const validatedResult = QuickPlacementResponseSchema.parse({
        ...result,
        metadata: {
          ...result.metadata,
          version: v1_1Enabled ? 'v1.1' : 'v1'
        }
      });

      return NextResponse.json({
        success: true,
        data: validatedResult,
        metadata: {
          version: v1_1Enabled ? 'v1.1' : 'v1',
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
      version: 'v1.1',
      features: {
        quick_placement_enabled: process.env.FEATURE_QUICK_PLACEMENT === 'true',
        v1_1_enabled: process.env.FEATURE_QP_V1_1 === 'true',
        shadow_mode_enabled: process.env.QP_SHADOW === 'true',
        self_assessment_fusion_enabled: process.env.FEATURE_PLACEMENT_FUSION !== 'false'
      },
      weights: {
        // v1 权重
        v1: {
          objective: parseFloat(process.env.PLACEMENT_OBJECTIVE_WEIGHT || '0.7'),
          self_assessment: parseFloat(process.env.PLACEMENT_SELF_WEIGHT || '0.3')
        },
        // v1.1 权重（三信号融合）
        v1_1: {
          scene: 0.6,
          objective: 0.3,
          self_assessment: 0.1,
          scene_no_objective: 0.8,  // 无客观题时场景权重
          self_no_objective: 0.2   // 无客观题时自评权重
        }
      },
      settings: {
        time_limit_seconds: 180,
        question_count: 10,
        max_scored_questions: 3,  // v1.1计分题数限制
        supported_locales: ['zh', 'en', 'ar'],
        supported_micro_bands: ['A2-', 'A2', 'A2+', 'B1-', 'B1']
      },
      rollout: {
        percentage: process.env.QP_ROLLOUT_PERCENT || '0',
        status: process.env.FEATURE_QP_V1_1 === 'true' ?
               (process.env.QP_SHADOW === 'true' ? 'shadow_mode' : 'active') : 'disabled'
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
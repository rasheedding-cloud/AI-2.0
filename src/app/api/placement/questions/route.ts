/**
 * QuickPlacement v1 - 题库API路由
 * GET /api/placement/questions?locale=zh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLocalizedQuestionBank, getQuestionBankStats } from '@/server/services/placement/qb_bank';
import { validateQBankContract, OBJECTIVES, SCENE_ANCHORS } from '@/server/services/placement/qb_schema';
import { QuestionBankResponseSchema, ApiResponseSchema } from '@/types/placement';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') as 'zh' | 'en' | 'ar' || 'en';

    // 验证语言参数
    if (!['zh', 'en', 'ar'].includes(locale)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_LOCALE',
          message: '不支持的语言，请使用 zh、en 或 ar'
        },
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      }, { status: 400 });
    }

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

    // 契约守卫：在校验前验证题库完整性
    try {
      console.log('🔍 API题库契约校验...');
      const contractValidation = validateQBankContract(OBJECTIVES, SCENE_ANCHORS);

      if (contractValidation.errors.length > 0) {
        console.error('❌ API题库契约校验失败:', contractValidation.errors);
        return NextResponse.json({
          success: false,
          error: {
            code: 'QB_CONTRACT_VALIDATION_FAILED',
            message: '题库契约校验失败',
            details: contractValidation.errors
          },
          metadata: {
            version: 'v1',
            timestamp: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
          }
        }, { status: 500 });
      }

      console.log('✅ API题库契约校验通过');
    } catch (error) {
      console.error('❌ API题库契约校验异常:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'QB_CONTRACT_VALIDATION_ERROR',
          message: '题库契约校验异常',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      }, { status: 500 });
    }

    // 获取本地化题库
    const questions = getLocalizedQuestionBank(locale);
    const stats = getQuestionBankStats();

    // 防泄题过滤：移除敏感字段
    const sanitizedQuestions = questions.slice(0, 10).map(question => ({
      id: question.id,
      text: question.text,
      audio_url: question.audio_url,
      options: question.options,
      type: question.type
      // 明确排除: correct, scored, level_hint 等敏感字段
    }));

    // 验证防泄题：确保响应中不包含答案信息
    const responseString = JSON.stringify(sanitizedQuestions);
    const forbiddenFields = ['correct', 'scored', 'level_hint', 'answer'];
    const leakedFields = forbiddenFields.filter(field => responseString.includes(field));

    if (leakedFields.length > 0) {
      console.error('🚨 检测到答案字段泄露:', leakedFields);
      return NextResponse.json({
        success: false,
        error: {
          code: 'ANSWER_LEAK_DETECTED',
          message: '检测到答案信息泄露',
          details: `泄露字段: ${leakedFields.join(', ')}`
        },
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      }, { status: 500 });
    }

    // 构建响应数据
    const responseData = {
      questions: sanitizedQuestions,
      locale,
      config: {
        time_limit_seconds: 180, // 3分钟
        question_count: 10
      },
      stats: {
        total_questions: stats.total_questions,
        by_scene: stats.by_scene,
        by_skill: stats.by_skill
      }
    };

    // 验证响应数据
    const validatedData = QuestionBankResponseSchema.parse(responseData);

    return NextResponse.json({
      success: true,
      data: validatedData,
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Placement questions API error:', error);

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
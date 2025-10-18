/**
 * QuickPlacement v1 - 题库API路由
 * GET /api/placement/questions?locale=zh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLocalizedQuestionBank, getQuestionBankStats } from '@/server/services/placement/qb_bank';
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

    // 获取本地化题库
    const questions = getLocalizedQuestionBank(locale);
    const stats = getQuestionBankStats();

    // 构建响应数据
    const responseData = {
      questions: questions.slice(0, 10), // 只返回前10题
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
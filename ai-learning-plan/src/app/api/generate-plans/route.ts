import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/server/services/aiService';
import { intakeSchema } from '@/lib/schema';
import type { Intake } from '@/types';

// 预处理表单数据，确保所有必需字段都存在
function preprocessIntakeData(intake: any): any {
  const processed = { ...intake };

  // 确保必需字段存在，如果不存在则提供默认值
  if (!processed.native_language) {
    processed.native_language = 'other'; // 默认值
    console.warn('Missing native_language, using default: other');
  }

  if (!processed.goal_free_text || processed.goal_free_text.trim().length === 0) {
    processed.goal_free_text = '提升英语能力，实现更好的沟通和学习发展。'; // 默认目标
    console.warn('Missing goal_free_text, using default value');
  }

  if (processed.zero_base === null || processed.zero_base === undefined) {
    processed.zero_base = false; // 默认不是零基础
    console.warn('Missing zero_base, using default: false');
  }

  // 确保其他必需字段
  if (!processed.gender) processed.gender = 'prefer_not_to_say';
  if (!processed.identity) processed.identity = 'working_adult';
  if (!processed.cultural_mode) processed.cultural_mode = 'gcc';

  // 处理native_language字段 - 确保是字符串
  if (Array.isArray(processed.native_language)) {
    processed.native_language = processed.native_language[0] || 'other';
    console.warn('native_language是数组，使用第一个元素:', processed.native_language);
  }

  // 额外的安全检查：确保native_language是有效值
  const validLanguages = ['ar', 'zh', 'other'];
  if (!validLanguages.includes(processed.native_language)) {
    console.warn('Invalid native_language value:', processed.native_language, 'mapping to other');
    processed.native_language = 'other';
  }

  // 映射不合规的值
  if (processed.native_language === 'en') {
    processed.native_language = 'other';
    console.warn('Mapped native_language from "en" to "other"');
  }

  // 清理和标准化字段
  if (processed.daily_minutes_pref && (typeof processed.daily_minutes_pref !== 'number' || processed.daily_minutes_pref < 25 || processed.daily_minutes_pref > 180)) {
    processed.daily_minutes_pref = 60; // 默认60分钟
  }

  if (processed.study_days_per_week && (typeof processed.study_days_per_week !== 'number' || processed.study_days_per_week < 3 || processed.study_days_per_week > 6)) {
    processed.study_days_per_week = 5; // 默认5天
  }

  console.log('Processed intake data:', processed);
  return processed;
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    if (!body.intake) {
      return NextResponse.json(
        { success: false, error: 'Missing intake data' },
        { status: 400 }
      );
    }

    // 预处理和验证表单数据
    const processedIntake = preprocessIntakeData(body.intake);
    console.log('预处理后的数据:', processedIntake);

    // 记录请求开始时间
    const startTime = Date.now();

    // 调用AI服务生成方案
    const result = await aiService.generatePlans(processedIntake as Intake);

    // 记录处理时间
    const processingTime = Date.now() - startTime;
    console.log(`Plans generation completed in ${processingTime}ms`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        processingTime,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in generate-plans API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}
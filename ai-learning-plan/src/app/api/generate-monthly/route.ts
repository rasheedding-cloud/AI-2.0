import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/server/services/aiService';
import { planOptionSchema, intakeSchema } from '@/lib/schema';
import type { PlanOption, Intake } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    console.log('🔄 [API] generate-monthly 请求开始:', {
      hasChosenPlan: !!body.chosenPlan,
      hasIntake: !!body.intake,
      chosenPlanTier: body.chosenPlan?.tier,
      chosenPlanTrack: body.chosenPlan?.track,
      intakeGoal: body.intake?.goal_free_text?.substring(0, 50) + '...'
    });

    // 验证必需字段
    if (!body.chosenPlan || !body.intake) {
      console.error('❌ [API] 缺少必需字段:', {
        hasChosenPlan: !!body.chosenPlan,
        hasIntake: !!body.intake
      });
      return NextResponse.json(
        { success: false, error: 'Missing chosenPlan or intake data' },
        { status: 400 }
      );
    }

    // 记录请求开始时间
    const startTime = Date.now();

    // 调用AI服务生成月度计划
    const result = await aiService.generateMonthlyPlan(
      body.chosenPlan as PlanOption,
      body.intake as Intake
    );

    // 记录处理时间
    const processingTime = Date.now() - startTime;
    console.log(`✅ [API] Monthly plan generation completed in ${processingTime}ms, success: ${result.success}`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        processingTime,
      });
    } else {
      console.error('❌ [API] AI服务返回错误:', {
        error: result.error,
        details: result.details
      });
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
    console.error('💥 [API] generate-monthly 发生异常:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

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
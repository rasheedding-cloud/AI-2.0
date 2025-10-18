import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/server/services/aiService';
import { monthlyPlanSchema, planOptionSchema, intakeSchema } from '@/lib/schema';
import type { MonthlyPlan, PlanOption, Intake } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证必需字段
    if (!body.monthlyPlan || !body.chosenPlan || !body.intake) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: monthlyPlan, chosenPlan, or intake data'
        },
        { status: 400 }
      );
    }

    // 记录请求开始时间
    const startTime = Date.now();

    // 调用AI服务生成首月课程大纲
    const result = await aiService.generateFirstMonthSyllabus(
      body.monthlyPlan as MonthlyPlan,
      body.chosenPlan as PlanOption,
      body.intake as Intake
    );

    // 记录处理时间
    const processingTime = Date.now() - startTime;
    console.log(`Syllabus generation completed in ${processingTime}ms`);

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
    console.error('Error in generate-syllabus API:', error);

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
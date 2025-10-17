import { NextResponse } from 'next/server';
import { assessGoalCEFR, FEATURE_FLAGS, healthCheck } from '@/server/services/assessor';
import type { Intake } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intake, options } = body;

    console.log('🧪 测试新的Goal Assessor系统:', {
      goal: intake.goal_free_text,
      flags: FEATURE_FLAGS,
      options
    });

    // 健康检查
    const health = await healthCheck();
    console.log('📊 系统健康状态:', health);

    // 测试新的评估系统
    const assessment = await assessGoalCEFR({
      learner_goal_free_text: intake.goal_free_text,
      self_assessed_level: intake.self_assessed_level,
      identity: intake.identity,
      native_language: intake.native_language,
      cultural_mode: intake.cultural_mode
    }, {
      shadow: options?.shadow || false,
      session_id: options?.session_id
    });

    return NextResponse.json({
      success: true,
      health,
      feature_flags: FEATURE_FLAGS,
      assessment,
      legacy_target: intake.track_override || 'auto-detected'
    });

  } catch (error) {
    console.error('Assessor test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      health: await healthCheck(),
      feature_flags: FEATURE_FLAGS
    }, { status: 500 });
  }
}

// 健康检查端点
export async function GET() {
  try {
    const health = await healthCheck();
    return NextResponse.json({
      success: true,
      health,
      feature_flags: FEATURE_FLAGS,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      feature_flags: FEATURE_FLAGS
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/server/services/aiService';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证文化模式参数
    const culturalMode = body.culturalMode || 'none';

    // 记录请求开始时间
    const startTime = Date.now();

    // 调用AI服务生成快速测试
    const result = await aiService.generateQuickTest(culturalMode);

    // 记录处理时间
    const processingTime = Date.now() - startTime;
    console.log(`Quick test generation completed in ${processingTime}ms`);

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
    console.error('Error in quick-test API:', error);

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
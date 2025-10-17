import { NextResponse } from 'next/server';
import { inferTargetBandFromIntake } from '@/lib/learning/caps';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intake } = body;

    console.log('🎯 测试CEFR目标推断:', intake.goal_free_text);
    console.log('📚 轨道:', intake.track_override);

    const targetBand = inferTargetBandFromIntake(intake);

    return NextResponse.json({
      success: true,
      goalText: intake.goal_free_text,
      track: intake.track_override,
      targetBand,
      explanation: getExplanation(intake.goal_free_text, targetBand)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getExplanation(goalText: string, targetBand: string): string {
  if (goalText.includes('英国') || goalText.includes('高校') || goalText.includes('留学')) {
    if (targetBand === 'B2') {
      return '英国高校通常要求雅思6.5分，对应B2水平';
    } else if (targetBand === 'B2+') {
      return '英国高校通常要求雅思7.0分，对应B2+水平';
    } else if (targetBand === 'B1+') {
      return '英国高校通常要求雅思6.0分，对应B1+水平';
    }
  }
  return `目标等级：${targetBand}`;
}
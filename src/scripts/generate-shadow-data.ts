/**
 * 影子数据生成工具
 * 用于生成模拟的影子模式数据，测试分析面板
 */

import { AssessmentDiff } from '../server/services/assessor';

// 模拟场景数据
const mockScenarios = [
  {
    name: '职场汇报',
    input_hash: 'work_presentation_hash',
    input_length: 45,
    v1_result: { targetBand: 'A2', track: 'work', confidence: 0.75 },
    v2_result: {
      target_band_primary: 'B1-',
      confidence_primary: 0.87,
      track_scores: [{ track: 'work', score: 0.92 }, { track: 'daily', score: 0.08 }]
    },
    ambiguity_flags: [],
    evidence_count: 3
  },
  {
    name: '旅行交流',
    input_hash: 'travel_complaint_hash',
    input_length: 38,
    v1_result: { targetBand: 'A2', track: 'travel', confidence: 0.71 },
    v2_result: {
      target_band_primary: 'A2+',
      confidence_primary: 0.83,
      track_scores: [{ track: 'travel', score: 0.95 }, { track: 'daily', score: 0.05 }]
    },
    ambiguity_flags: [],
    evidence_count: 4
  },
  {
    name: '学术展示',
    input_hash: 'study_presentation_hash',
    input_length: 42,
    v1_result: { targetBand: 'A2', track: 'study', confidence: 0.68 },
    v2_result: {
      target_band_primary: 'B1-',
      confidence_primary: 0.82,
      track_scores: [{ track: 'study', score: 0.88 }, { track: 'daily', score: 0.12 }]
    },
    ambiguity_flags: [],
    evidence_count: 3
  },
  {
    name: '会议简介',
    input_hash: 'meeting_intro_hash',
    input_length: 28,
    v1_result: { targetBand: 'B1', track: 'work', confidence: 0.73 },
    v2_result: {
      target_band_primary: 'A2',
      confidence_primary: 0.88,
      track_scores: [{ track: 'work', score: 0.42 }, { track: 'daily', score: 0.58 }]
    },
    ambiguity_flags: ['mixed_intents'],
    evidence_count: 2
  },
  {
    name: '医疗行业',
    input_hash: 'medical_conference_hash',
    input_length: 35,
    v1_result: { targetBand: 'B1', track: 'work', confidence: 0.70 },
    v2_result: {
      target_band_primary: 'B1-',
      confidence_primary: 0.79,
      track_scores: [{ track: 'work', score: 0.85 }, { track: 'daily', score: 0.15 }]
    },
    ambiguity_flags: [],
    evidence_count: 2,
    domain_risk: 'high'
  },
  {
    name: '法律文件',
    input_hash: 'legal_document_hash',
    input_length: 40,
    v1_result: { targetBand: 'B1', track: 'work', confidence: 0.72 },
    v2_result: {
      target_band_primary: 'B1',
      confidence_primary: 0.85,
      track_scores: [{ track: 'work', score: 0.90 }, { track: 'daily', score: 0.10 }]
    },
    ambiguity_flags: [],
    evidence_count: 2,
    domain_risk: 'high'
  },
  {
    name: '日常交流',
    input_hash: 'daily_communication_hash',
    input_length: 32,
    v1_result: { targetBand: 'A2', track: 'daily', confidence: 0.69 },
    v2_result: {
      target_band_primary: 'A2',
      confidence_primary: 0.76,
      track_scores: [{ track: 'daily', score: 0.92 }, { track: 'work', score: 0.08 }]
    },
    ambiguity_flags: [],
    evidence_count: 1
  },
  {
    name: '考试准备',
    input_hash: 'exam_preparation_hash',
    input_length: 48,
    v1_result: { targetBand: 'B1', track: 'exam', confidence: 0.74 },
    v2_result: {
      target_band_primary: 'B1-',
      confidence_primary: 0.84,
      track_scores: [{ track: 'exam', score: 0.96 }, { track: 'study', score: 0.04 }]
    },
    ambiguity_flags: [],
    evidence_count: 2
  }
];

// 生成单个影子数据
function generateShadowData(scenario: any, index: number): AssessmentDiff {
  const session_id = `shadow_test_${scenario.name}_${index}_${Date.now()}`;
  const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

  // 计算差异
  const band_diff = scenario.v1_result.targetBand !== scenario.v2_result.target_band_primary;
  const track_diff = scenario.v1_result.track !== scenario.v2_result.track_scores[0].track;
  const confidence_diff = Math.abs(scenario.v2_result.confidence_primary - scenario.v1_result.confidence);

  return {
    session_id,
    timestamp,
    v1_result: scenario.v1_result,
    v2_result: scenario.v2_result,
    diff_summary: {
      band_diff,
      confidence_diff,
      track_diff
    },
    ambiguity_flags: scenario.ambiguity_flags,
    evidence_count: scenario.evidence_count
  };
}

// 生成批量影子数据
export function generateMockShadowData(count: number = 87): AssessmentDiff[] {
  const data: AssessmentDiff[] = [];

  for (let i = 0; i < count; i++) {
    const scenario = mockScenarios[i % mockScenarios.length];
    const shadowData = generateShadowData(scenario, i);
    data.push(shadowData);
  }

  // 按时间排序
  data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return data;
}

// 发送数据到分析API
export async function sendShadowDataToAnalytics(count: number = 87): Promise<void> {
  const mockData = generateMockShadowData(count);

  console.log(`生成 ${count} 条影子数据...`);

  for (const data of mockData) {
    try {
      const response = await fetch('http://localhost:3000/api/assessor/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log(`✅ 发送数据成功: ${data.session_id}`);
      } else {
        console.error(`❌ 发送数据失败: ${data.session_id}`);
      }
    } catch (error) {
      console.error(`❌ 发送数据异常: ${data.session_id}`, error);
    }

    // 添加小延迟，避免过快请求
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ 完成发送 ${count} 条影子数据`);
}

// 如果直接运行此脚本
if (require.main === module) {
  sendShadowDataToAnalytics(87)
    .then(() => {
      console.log('🎉 影子数据生成完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 生成失败:', error);
      process.exit(1);
    });
}
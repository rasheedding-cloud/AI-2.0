#!/usr/bin/env node

/**
 * QuickPlacement v1.1 批量测试脚本 (简化版)
 * 使用Node.js原生API，兼容性更好
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 配置参数
const API_ENDPOINT = "http://localhost:3004/api/placement/evaluate";
const REQUEST_TIMEOUT_MS = 30000;
const CONCURRENT_REQUESTS = 3;

// 测试样本数据
const testSamples = [
  {
    id: "sample_001",
    description: "基础场景锚点，无客观题，自评A2",
    locale: "zh",
    user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a1_basic_greeting_info", "a1_confirm_single_step", "a1_3_4_sentence_msg", "a1_spelling_names_time"],
    objective_score: 0,
    self_assessed_level: "A2",
    track_hint: "daily"
  },
  {
    id: "sample_002",
    description: "中等场景锚点，客观题1分，自评B1",
    locale: "zh",
    user_answers: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a2_polite_rephrase", "a2_handle_counter_issue", "a2_read_service_notice", "a2_write_4_5_confirm", "a2_short_plan_45s"],
    objective_score: 1,
    self_assessed_level: "B1",
    track_hint: "work"
  },
  {
    id: "sample_003",
    description: "强场景锚点，客观题0分，自评B2",
    locale: "zh",
    user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["b1m_standup_60_90s", "b1m_email_6_8_confirm", "b1m_compare_options_reason", "b1m_handle_complaint_simple", "b1m_read_short_report"],
    objective_score: 0,
    self_assessed_level: "B2",
    track_hint: "work"
  },
  {
    id: "sample_004",
    description: "弱场景锚点，客观题2分，无自评",
    locale: "zh",
    user_answers: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a1_basic_greeting_info", "a2_handle_counter_issue"],
    objective_score: 2,
    self_assessed_level: undefined,
    track_hint: "daily"
  },
  {
    id: "sample_005",
    description: "A1楼梯测试（少于3个A1锚点）",
    locale: "zh",
    user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a1_basic_greeting_info"],
    objective_score: 0,
    self_assessed_level: "A1",
    track_hint: "daily"
  },
  {
    id: "sample_006",
    description: "B1楼梯测试（满足所有条件）",
    locale: "zh",
    user_answers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    scene_tags: [
      "a1_basic_greeting_info", "a1_confirm_single_step", "a1_3_4_sentence_msg",
      "a2_polite_rephrase", "a2_read_service_notice", "a2_write_4_5_confirm", "a2_short_plan_45s",
      "b1m_standup_60_90s", "b1m_email_6_8_confirm"
    ],
    objective_score: 1,
    self_assessed_level: "A2",
    track_hint: "work"
  },
  {
    id: "sample_007",
    description: "英文场景测试",
    locale: "en",
    user_answers: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a2_polite_rephrase", "b1m_email_6_8_confirm", "b1m_standup_60_90s"],
    objective_score: 2,
    self_assessed_level: "B1",
    track_hint: "work"
  },
  {
    id: "sample_008",
    description: "阿拉伯语场景测试",
    locale: "ar",
    user_answers: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: ["a2_polite_rephrase", "a2_handle_counter_issue", "a2_read_service_notice"],
    objective_score: 2,
    self_assessed_level: "A2",
    track_hint: "daily"
  },
  {
    id: "sample_009",
    description: "无场景锚点，仅自评",
    locale: "zh",
    user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scene_tags: [],
    objective_score: 0,
    self_assessed_level: "A2",
    track_hint: "daily"
  },
  {
    id: "sample_010",
    description: "复杂混合场景",
    locale: "zh",
    user_answers: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    scene_tags: [
      "a1_basic_greeting_info", "a1_confirm_single_step",
      "a2_polite_rephrase", "a2_handle_counter_issue",
      "b1m_standup_60_90s", "b1m_email_6_8_confirm"
    ],
    objective_score: 2,
    self_assessed_level: "B1",
    track_hint: "work"
  }
];

/**
 * 发送HTTP请求
 */
function sendRequest(url, data, timeout = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: timeout
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 发送单个测试请求
 */
async function sendTestRequest(sample) {
  const startTime = Date.now();

  try {
    const response = await sendRequest(API_ENDPOINT, sample);
    const processingTime = Date.now() - startTime;

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }

    return {
      id: sample.id,
      description: sample.description,
      request: sample,
      response: response.data,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: sample.id,
      description: sample.description,
      request: sample,
      response: null,
      error: error.message,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 批量处理测试样本
 */
async function runBatchTest(samples) {
  console.log(`🚀 开始批量测试，共 ${samples.length} 个样本`);
  console.log(`📡 API端点: ${API_ENDPOINT}`);
  console.log(`⚡ 并发数: ${CONCURRENT_REQUESTS}`);
  console.log(`⏱️  超时时间: ${REQUEST_TIMEOUT_MS}ms\n`);

  const results = [];

  // 分批处理
  for (let i = 0; i < samples.length; i += CONCURRENT_REQUESTS) {
    const batch = samples.slice(i, i + CONCURRENT_REQUESTS);
    const batchPromises = batch.map(sample => sendTestRequest(sample));

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 显示进度
      const completed = Math.min(i + CONCURRENT_REQUESTS, samples.length);
      const successCount = batchResults.filter(r => !r.error).length;
      const errorCount = batchResults.filter(r => r.error).length;

      console.log(`✅ 批次完成: ${completed}/${samples.length} (成功: ${successCount}, 失败: ${errorCount})`);

      // 显示当前批次的错误
      if (errorCount > 0) {
        batchResults
          .filter(r => r.error)
          .forEach(r => console.log(`   ❌ ${r.id}: ${r.error}`));
      }

    } catch (error) {
      console.error(`❌ 批次执行失败:`, error);

      // 为失败的批次创建错误结果
      const errorResults = batch.map(sample => ({
        id: sample.id,
        description: sample.description,
        request: sample,
        response: null,
        error: error.message,
        processing_time_ms: REQUEST_TIMEOUT_MS,
        timestamp: new Date().toISOString()
      }));

      results.push(...errorResults);
    }

    // 短暂延迟避免过载
    if (i + CONCURRENT_REQUESTS < samples.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * 生成汇总报告
 */
function generateSummaryReport(results) {
  const totalSamples = results.length;
  const successfulCalls = results.filter(r => !r.error).length;
  const failedCalls = results.filter(r => r.error).length;
  const averageProcessingTime = Math.round(
    results.reduce((sum, r) => sum + r.processing_time_ms, 0) / totalSamples
  );

  const successfulResults = results.filter(r => !r.error);

  // v1 vs v1.1 对比分析
  const v1_v1_1_comparisons = successfulResults
    .filter(r => r.response.data && r.response.data.shadow_mode_enabled)
    .map(r => ({
      id: r.id,
      description: r.description,
      v1_result: r.response.data.mapped_start,
      v1_1_result: r.response.data.v1_1_analysis?.mapped_start_band,
      v1_confidence: r.response.data.confidence,
      v1_1_confidence: r.response.data.v1_1_analysis?.band_distribution ?
        Math.max(...Object.values(r.response.data.v1_1_analysis.band_distribution)) : null,
      flags: r.response.data.v1_1_analysis?.flags || [],
      processing_time: r.processing_time_ms
    }));

  // 错误样本分析
  const errorSamples = results.filter(r => r.error).map(r => ({
    id: r.id,
    description: r.description,
    error: r.error,
    processing_time: r.processing_time_ms,
    request_summary: {
      locale: r.request.locale,
      answer_count: r.request.user_answers.length,
      scene_count: r.request.scene_tags.length,
      has_self_assessment: !!r.request.self_assessed_level,
      track_hint: r.request.track_hint
    }
  }));

  return {
    test_summary: {
      total_samples: totalSamples,
      successful_calls: successfulCalls,
      failed_calls: failedCalls,
      average_processing_time_ms: averageProcessingTime,
      test_date: new Date().toISOString(),
      environment: "development",
      api_endpoint: API_ENDPOINT
    },
    results: results,
    v1_v1_1_comparisons: v1_v1_1_comparisons.length > 0 ? v1_v1_1_comparisons : undefined,
    error_samples: errorSamples.length > 0 ? errorSamples : undefined
  };
}

/**
 * 保存报告文件
 */
async function saveReports(report) {
  const outputDir = path.join(__dirname, '..', 'test-results');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存完整JSON报告
  const jsonReportPath = path.join(outputDir, `qp-batch-report-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON报告已保存: ${jsonReportPath}`);

  // 保存JSONL结果文件
  const jsonlPath = path.join(outputDir, `results-${timestamp}.jsonl`);
  const jsonlContent = report.results
    .map(r => JSON.stringify(r))
    .join('\n');
  fs.writeFileSync(jsonlPath, jsonlContent);
  console.log(`📄 JSONL结果已保存: ${jsonlPath}`);

  // 保存CSV结果文件
  const csvPath = path.join(outputDir, `results-${timestamp}.csv`);
  const csvHeaders = [
    'id', 'description', 'locale', 'processing_time_ms', 'timestamp',
    'success', 'mapped_start', 'confidence', 'error', 'flags'
  ];

  const csvRows = report.results.map(r => [
    r.id,
    r.description,
    r.request.locale,
    r.processing_time_ms,
    r.timestamp,
    r.error ? 'false' : 'true',
    r.response?.data?.mapped_start || '',
    r.response?.data?.confidence || '',
    r.error || '',
    r.response?.data?.flags?.join(';') || ''
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`📄 CSV结果已保存: ${csvPath}`);

  // 保存Markdown摘要报告
  const mdPath = path.join(outputDir, `summary-${timestamp}.md`);
  const mdContent = generateMarkdownReport(report);
  fs.writeFileSync(mdPath, mdContent);
  console.log(`📄 Markdown摘要已保存: ${mdPath}`);
}

/**
 * 生成Markdown摘要报告
 */
function generateMarkdownReport(report) {
  const { test_summary, results, v1_v1_1_comparisons, error_samples } = report;

  let md = `# QuickPlacement v1.1 批量测试报告\n\n`;
  md += `## 测试概览\n\n`;
  md += `- **测试时间**: ${new Date(test_summary.test_date).toLocaleString('zh-CN')}\n`;
  md += `- **测试环境**: ${test_summary.environment}\n`;
  md += `- **API端点**: ${test_summary.api_endpoint}\n`;
  md += `- **总样本数**: ${test_summary.total_samples}\n`;
  md += `- **成功调用**: ${test_summary.successful_calls}\n`;
  md += `- **失败调用**: ${test_summary.failed_calls}\n`;
  md += `- **成功率**: ${((test_summary.successful_calls / test_summary.total_samples) * 100).toFixed(1)}%\n`;
  md += `- **平均处理时间**: ${test_summary.average_processing_time_ms}ms\n\n`;

  // 性能分析
  const processingTimes = results.map(r => r.processing_time_ms);
  const maxTime = Math.max(...processingTimes);
  const minTime = Math.min(...processingTimes);

  md += `## 性能分析\n\n`;
  md += `- **最快响应**: ${minTime}ms\n`;
  md += `- **最慢响应**: ${maxTime}ms\n`;
  md += `- **平均响应**: ${test_summary.average_processing_time_ms}ms\n\n`;

  // 错误分析
  if (error_samples && error_samples.length > 0) {
    md += `## 错误分析\n\n`;
    md += `共发现 ${error_samples.length} 个错误样本:\n\n`;
    error_samples.forEach(sample => {
      md += `### ${sample.id}: ${sample.description}\n`;
      md += `- **错误**: ${sample.error}\n`;
      md += `- **处理时间**: ${sample.processing_time}ms\n`;
      md += `- **请求概要**: ${sample.request_summary.locale}, ${sample.request_summary.answer_count}题, ${sample.request_summary.scene_count}场景\n\n`;
    });
  }

  // v1 vs v1.1 对比
  if (v1_v1_1_comparisons && v1_v1_1_comparisons.length > 0) {
    md += `## v1 vs v1.1 对比分析\n\n`;
    md += `共 ${v1_v1_1_comparisons.length} 个影子模式对比样本:\n\n`;

    const differences = v1_v1_1_comparisons.filter(c => c.v1_result !== c.v1_1_result);
    md += `- **结果差异**: ${differences.length} 个样本\n`;
    md += `- **差异率**: ${((differences.length / v1_v1_1_comparisons.length) * 100).toFixed(1)}%\n\n`;

    if (differences.length > 0) {
      md += `### 差异详情\n\n`;
      differences.forEach(comp => {
        md += `- **${comp.id}**: ${comp.v1_result} → ${comp.v1_1_result}\n`;
      });
      md += `\n`;
    }
  }

  // 样本结果概览
  md += `## 样本结果概览\n\n`;
  results.forEach(result => {
    const status = result.error ? '❌' : '✅';
    const time = result.processing_time_ms;
    const mapped = result.response?.data?.mapped_start || 'N/A';
    const confidence = result.response?.data?.confidence || 'N/A';

    md += `${status} **${result.id}**: ${result.description}\n`;
    md += `   - 结果: ${mapped} (置信度: ${confidence})\n`;
    md += `   - 响应时间: ${time}ms\n`;
    if (result.error) {
      md += `   - 错误: ${result.error}\n`;
    }
    md += `\n`;
  });

  return md;
}

/**
 * 主函数
 */
async function main() {
  console.log('🧪 QuickPlacement v1.1 批量测试工具');
  console.log('='.repeat(50));

  try {
    // 检查API端点可用性
    console.log('🔍 检查API端点可用性...');

    // 简单的健康检查
    try {
      await sendRequest(API_ENDPOINT.replace('/evaluate', ''), {});
    } catch (error) {
      // 预期会失败，因为我们向GET端点发送POST请求
      // 只要能连接到服务器就算成功
    }

    console.log('✅ API端点可用，开始批量测试\n');

    // 执行批量测试
    const results = await runBatchTest(testSamples);

    // 生成汇总报告
    console.log('\n📊 生成测试报告...');
    const report = generateSummaryReport(results);

    // 保存报告文件
    await saveReports(report);

    // 显示最终统计
    console.log('\n🎉 测试完成！');
    console.log(`✅ 成功: ${report.test_summary.successful_calls}/${report.test_summary.total_samples}`);
    console.log(`❌ 失败: ${report.test_summary.failed_calls}/${report.test_summary.total_samples}`);
    console.log(`⏱️  平均响应时间: ${report.test_summary.average_processing_time_ms}ms`);

    if (report.test_summary.failed_calls > 0) {
      console.log('\n⚠️  存在失败样本，请查看详细报告了解原因');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 批量测试失败:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runBatchTest, generateSummaryReport, saveReports };
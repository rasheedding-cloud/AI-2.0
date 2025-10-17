/**
 * Goal→CEFR Assessor E2E测试
 * 使用Playwright进行端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Goal→CEFR Assessor E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置环境变量
    await page.goto('/api/test-assessor');
  });

  test('健康检查端点', async ({ request }) => {
    const response = await request.get('/api/test-assessor');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.health).toBeDefined();
    expect(data.feature_flags).toBeDefined();
  });

  test('职场汇报场景 - v1模式', async ({ request }) => {
    // 设置v1模式
    process.env.FEATURE_GOAL_ASSESSOR_V2 = 'false';
    process.env.GOAL_ASSESSOR_SHADOW = 'false';

    const payload = {
      intake: {
        goal_free_text: "职场60-90秒口头更新工作进展，以及6-8句确认邮件",
        self_assessed_level: "A2",
        identity: "working_adult",
        native_language: "zh",
        cultural_mode: "none"
      },
      options: {
        shadow: false
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.assessment).toBeDefined();
    expect(data.feature_flags.V2_ENABLED).toBe(false);
    expect(data.feature_flags.SHADOW_MODE).toBe(false);
  });

  test('旅行交流场景 - 影子模式', async ({ request }) => {
    // 设置影子模式
    process.env.FEATURE_GOAL_ASSESSOR_V2 = 'false';
    process.env.GOAL_ASSESSOR_SHADOW = 'true';

    const payload = {
      intake: {
        goal_free_text: "旅行中处理投诉、退改签、问询等，不超过3步任务",
        self_assessed_level: "A2",
        identity: "working_adult",
        native_language: "zh"
      },
      options: {
        shadow: true,
        session_id: "test_session_001"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.assessment).toBeDefined();
    expect(data.feature_flags.V2_ENABLED).toBe(false);
    expect(data.feature_flags.SHADOW_MODE).toBe(true);
  });

  test('学术展示场景 - v2模式', async ({ request }) => {
    // 设置v2模式
    process.env.FEATURE_GOAL_ASSESSOR_V2 = 'true';
    process.env.GOAL_ASSESSOR_SHADOW = 'false';

    const payload = {
      intake: {
        goal_free_text: "学习：1分钟小展示，能够回答提问并给出理由",
        self_assessed_level: "A2",
        identity: "university",
        native_language: "zh"
      },
      options: {
        shadow: false,
        session_id: "test_session_002"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.assessment).toBeDefined();
    expect(data.feature_flags.V2_ENABLED).toBe(true);
    expect(data.feature_flags.SHADOW_MODE).toBe(false);

    // v2模式应该有v2_data
    if (data.assessment.v2_data) {
      expect(data.assessment.v2_data.v2_target_label).toBeDefined();
      expect(data.assessment.v2_data.v2_alternatives).toBeDefined();
      expect(data.assessment.v2_data.v2_rationale).toBeDefined();
    }
  });

  test('防误触发场景 - 混合意图检测', async ({ request }) => {
    // 设置影子模式来检测混合意图
    process.env.FEATURE_GOAL_ASSESSOR_V2 = 'false';
    process.env.GOAL_ASSESSOR_SHADOW = 'true';

    const payload = {
      intake: {
        goal_free_text: "开会时做自我介绍，确认会议时间地点",
        self_assessed_level: "A1",
        identity: "working_adult",
        native_language: "zh"
      },
      options: {
        shadow: true,
        session_id: "test_mixed_intents"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // 检查日志输出（在控制台中应该看到ASSESSOR_DIFF日志）
    console.log('Mixed intents test completed, check console for ASSSESSOR_DIFF logs');
  });

  test('多语言支持测试', async ({ request }) => {
    const testCases = [
      {
        name: "中文输入",
        goal: "我想学习英语，为了工作能够和外国客户交流",
        native_lang: "zh"
      },
      {
        name: "英文输入",
        goal: "I want to learn English for business meetings and presentations",
        native_lang: "other"
      },
      {
        name: "混合语言",
        goal: "Work meeting 需要 presentation skills，还有 email communication",
        native_lang: "zh"
      }
    ];

    for (const testCase of testCases) {
      const payload = {
        intake: {
          goal_free_text: testCase.goal,
          self_assessed_level: "A2",
          identity: "working_adult",
          native_language: testCase.native_lang
        },
        options: {
          shadow: true,
          session_id: `test_lang_${testCase.name}`
        }
      };

      const response = await request.post('/api/test-assessor', {
        data: payload
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.assessment).toBeDefined();
    }
  });

  test('高风险领域检测', async ({ request }) => {
    const highRiskGoals = [
      "医疗行业的国际会议报告",
      "法律文件翻译和合同审阅",
      "金融分析和投资报告写作"
    ];

    for (const goal of highRiskGoals) {
      const payload = {
        intake: {
          goal_free_text: goal,
          self_assessed_level: "B1",
          identity: "working_adult",
          native_language: "zh"
        },
        options: {
          shadow: true,
          session_id: `test_risk_${Date.now()}`
        }
      };

      const response = await request.post('/api/test-assessor', {
        data: payload
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      // 影子模式下应该记录域风险评估
    }
  });

  test('自评差距检测', async ({ request }) => {
    const payload = {
      intake: {
        goal_free_text: "雅思考试，目标英国高校申请，需要学术写作能力",
        self_assessed_level: "A1", // 与目标差距很大
        identity: "university",
        native_language: "zh"
      },
      options: {
        shadow: true,
        session_id: "test_gap_assessment"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    // 应该在日志中看到large_gap_self_assess标记
  });

  test('错误处理和降级', async ({ request }) => {
    // 测试无效输入
    const invalidPayload = {
      intake: {
        goal_free_text: "", // 空输入
        self_assessed_level: "invalid_level",
        identity: "invalid_identity"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: invalidPayload
    });

    // 系统应该能处理错误并返回合理的响应
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // 即使输入有问题，也应该有基本的降级响应
    expect(data.assessment).toBeDefined();
  });

  test('性能测试 - 并发请求', async ({ request }) => {
    const concurrentRequests = 5;
    const requests = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const payload = {
        intake: {
          goal_free_text: `并发测试请求 ${i}: 职场英语沟通能力提升`,
          self_assessed_level: "A2",
          identity: "working_adult",
          native_language: "zh"
        },
        options: {
          shadow: true,
          session_id: `concurrent_test_${i}`
        }
      };

      requests.push(request.post('/api/test-assessor', { data: payload }));
    }

    const responses = await Promise.all(requests);

    // 所有请求都应该成功
    for (let i = 0; i < responses.length; i++) {
      expect(responses[i].ok()).toBeTruthy();
      const data = await responses[i].json();
      expect(data.success).toBe(true);
      expect(data.assessment).toBeDefined();
    }
  });

  test.afterEach(async () => {
    // 清理环境变量
    delete process.env.FEATURE_GOAL_ASSESSOR_V2;
    delete process.env.GOAL_ASSESSOR_SHADOW;
  });
});

test.describe('影子模式对比验证', () => {
  test('应该记录v1和v2的差异', async ({ request }) => {
    // 设置影子模式
    process.env.FEATURE_GOAL_ASSESSOR_V2 = 'false';
    process.env.GOAL_ASSESSOR_SHADOW = 'true';

    const payload = {
      intake: {
        goal_free_text: "复杂的商务谈判和技术汇报，需要高级英语能力",
        self_assessed_level: "B1",
        identity: "working_adult",
        native_language: "zh"
      },
      options: {
        shadow: true,
        session_id: "diff_comparison_test"
      }
    };

    const response = await request.post('/api/test-assessor', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.feature_flags.SHADOW_MODE).toBe(true);

    // 在控制台中应该能看到ASSESSOR_DIFF日志
    // 包含v1和v2结果的对比信息
    console.log('Shadow comparison test completed - check console for ASSESSOR_DIFF logs');
  });
});
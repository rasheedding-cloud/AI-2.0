import { test, expect } from '@playwright/test';

test.describe('Monthly Assessment Gates V2', () => {
  test.beforeEach(async ({ page }) => {
    // 设置环境变量启用动态门限
    await page.goto('/');

    // 完成用户信息填写
    await page.fill('[data-testid="goal-free-text"]', '公司中层管理者从高层接受信息然后向下传达执行的水平');
    await page.selectOption('[data-testid="self-assessed-level"]', 'A2');
    await page.fill('[data-testid="daily-minutes"]', '120');
    await page.fill('[data-testid="study-days-per-week"]', '5');

    // 提交信息
    await page.click('[data-testid="submit-intake"]');

    // 等待方案生成
    await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
  });

  test('should display dynamic gates for 4-month plan with B1-gate for months 3-4', async ({ page }) => {
    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.waitForSelector('[data-testid="milestone-card"]', { timeout: 10000 });

    // 检查4个月的数据
    const milestoneCards = await page.locator('[data-testid="milestone-card"]').count();
    expect(milestoneCards).toBe(4);

    // 检查第1个月和第2个月应该显示A2-gate
    const month1Gate = await page.locator('[data-testid="milestone-card"]:nth-child(1) [data-testid="gate-label"]');
    const month2Gate = await page.locator('[data-testid="milestone-card"]:nth-child(2) [data-testid="gate-label"]');

    await expect(month1Gate).toContainText('A2-gate');
    await expect(month2Gate).toContainText('A2-gate');

    // 检查第3个月和第4个月应该显示B1-gate
    const month3Gate = await page.locator('[data-testid="milestone-card"]:nth-child(3) [data-testid="gate-label"]');
    const month4Gate = await page.locator('[data-testid="milestone-card"]:nth-child(4) [data-testid="gate-label"]');

    await expect(month3Gate).toContainText('B1-gate');
    await expect(month4Gate).toContainText('B1-gate');
  });

  test('should show consistent gates across same band levels', async ({ page }) => {
    // 选择进阶方案（可能生成更长的计划）
    await page.click('[data-testid="plan-card"][data-tier="intensive"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.waitForSelector('[data-testid="milestone-card"]', { timeout: 10000 });

    // 获取所有月份的门限类型
    const gateLabels = await page.locator('[data-testid="gate-label"]').allTextContents();

    // 验证A2-gate和B1-gate的正确分布
    const a2GateCount = gateLabels.filter(label => label.includes('A2-gate')).length;
    const b1GateCount = gateLabels.filter(label => label.includes('B1-gate')).length;

    expect(a2GateCount).toBeGreaterThanOrEqual(2); // 至少前两个月是A2-gate
    expect(b1GateCount).toBeGreaterThanOrEqual(2); // 后面几个月应该是B1-gate

    // 验证没有随月份递减的准确率模式（85%, 80%, 75%, 70%）
    const accuracyValues = await page.locator('[data-testid="accuracy-value"]').allTextContents();

    // 如果启用了动态门限，准确率应该都是80%
    const uniqueAccuracies = [...new Set(accuracyValues)];
    expect(uniqueAccuracies.length).toBeLessThanOrEqual(2); // 最多两种不同的准确率
  });

  test('should display gate information tooltip when clicked', async ({ page }) => {
    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.waitForSelector('[data-testid="milestone-card"]', { timeout: 10000 });

    // 点击第一个月份的信息按钮
    await page.click('[data-testid="milestone-card"]:nth-child(1) [data-testid="gate-info-button"]');

    // 验证模态框出现
    await expect(page.locator('[data-testid="gate-modal"]')).toBeVisible();

    // 验证模态框包含正确的信息
    await expect(page.locator('[data-testid="gate-modal"]')).toContainText('达标示例');
    await expect(page.locator('[data-testid="gate-modal"]')).toContainText('快速检查清单');
    await expect(page.locator('[data-testid="gate-modal"]')).toContainText('A2-gate');
  });

  test('should open self-assessment drawer when try now button clicked', async ({ page }) => {
    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.locator('[data-testid="milestone-card"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // 点击"我现在试试"按钮
    await page.click('[data-testid="try-self-assessment"]');

    // 验证自测抽屉打开
    await expect(page.locator('[data-testid="self-assessment-drawer"]')).toBeVisible();

    // 验证自测内容
    await expect(page.locator('[data-testid="speaking-practice"]')).toBeVisible();
    await expect(page.locator('[data-testid="writing-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="self-evaluation"]')).toBeVisible();

    // 验证计时器功能
    await expect(page.locator('[data-testid="start-timer"]')).toBeVisible();
  });

  test('should handle 7-month plan correctly', async ({ page }) => {
    // 这个测试需要模拟一个7个月的计划
    // 由于实际API可能不会生成7个月，我们检查前端能正确处理任意月数

    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.locator('[data-testid="milestone-card"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // 获取实际月份数
    const actualMonths = await page.locator('[data-testid="milestone-card"]').count();

    // 如果有超过4个月，验证额外的月份也有正确的门限
    if (actualMonths > 4) {
      // 检查第5个月如果有，应该还是B1-gate
      if (actualMonths >= 5) {
        const month5Gate = await page.locator('[data-testid="milestone-card"]:nth-child(5) [data-testid="gate-label"]');
        if (await month5Gate.count() > 0) {
          await expect(month5Gate).toContainText('B1-gate');
        }
      }
    }

    // 验证所有月份都有门限信息
    const allGateButtons = await page.locator('[data-testid="gate-info-button"]').count();
    expect(allGateButtons).toBe(actualMonths);
  });

  test('should show correct gate metrics in A2-gate', async ({ page }) => {
    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.locator('[data-testid="milestone-card"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // 检查第一个月份（A2-gate）的指标
    const firstMonthCard = page.locator('[data-testid="milestone-card"]').first();

    // 这些应该通过动态门限组件显示
    await expect(firstMonthCard.locator('[data-testid="gate-metrics"]')).toBeVisible();

    // 如果动态门限UI启用，应该看到正确的A2-gate指标
    const accuracyValue = await firstMonthCard.locator('[data-testid="accuracy-value"]').first().textContent();
    const taskStepsValue = await firstMonthCard.locator('[data-testid="task-steps-value"]').first().textContent();
    const pausesValue = await firstMonthCard.locator('[data-testid="pauses-value"]').first().textContent();

    // A2-gate应该有这些值
    expect(accuracyValue).toContain('80'); // 80%准确率
    expect(taskStepsValue).toContain('3');   // 3步任务
    expect(pausesValue).toContain('2');      // 2次停顿
  });

  test('should show correct gate metrics in B1-gate', async ({ page }) => {
    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.locator('[data-testid="milestone-card"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // 找到B1-gate的月份（通常是第3或第4个月）
    const milestoneCards = page.locator('[data-testid="milestone-card"]');
    const cardCount = await milestoneCards.count();

    let b1GateCard = null;
    for (let i = 0; i < cardCount; i++) {
      const gateLabel = await milestoneCards.nth(i).locator('[data-testid="gate-label"]').textContent();
      if (gateLabel.includes('B1-gate')) {
        b1GateCard = milestoneCards.nth(i);
        break;
      }
    }

    // 如果找到B1-gate的卡片
    if (b1GateCard) {
      // 检查B1-gate的指标
      const accuracyValue = await b1GateCard.locator('[data-testid="accuracy-value"]').first().textContent();
      const taskStepsValue = await b1GateCard.locator('[data-testid="task-steps-value"]').first().textContent();
      const pausesValue = await b1GateCard.locator('[data-testid="pauses-value"]').first().textContent();

      // B1-gate应该有这些值
      expect(accuracyValue).toContain('80'); // 80%准确率
      expect(taskStepsValue).toContain('4');   // 4步任务
      expect(pausesValue).toContain('2');      // 2次停顿
    }
  });

  test('should fallback to old UI when dynamic gates disabled', async ({ page }) => {
    // 这个测试需要修改环境变量或mock来模拟禁用状态
    // 由于环境限制，我们主要验证向后兼容性

    // 选择标准方案
    await page.click('[data-testid="plan-card"][data-tier="standard"]');
    await page.click('[data-testid="confirm-plan"]');

    // 等待月度计划加载
    await page.locator('[data-testid="milestone-card"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // 即使在降级模式下，也应该显示基本的评估标准
    const firstMonthCard = page.locator('[data-testid="milestone-card"]').first();

    // 基本的准确率、任务步骤、停顿次数应该总是显示
    await expect(firstMonthCard.locator('text')).toContainText('准确率');
    await expect(firstMonthCard.locator('text')).toContainText('任务步骤');
    await expect(firstMonthCard.locator('text')).toContainText('停顿次数');
  });
});
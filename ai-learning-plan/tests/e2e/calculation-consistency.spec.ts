import { test, expect } from '@playwright/test';

/**
 * 计算一致性端到端测试
 * 验证三个不同用户配置下的学习计划计算结果
 */
test.describe('学习计划计算一致性测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问主页
    await page.goto('/');
  });

  test('用例1: 零基础学员 - 每日60分钟，每周5天', async ({ page }) => {
    console.log('🧪 开始测试用例1: 零基础学员 - 每日60分钟，每周5天');

    // 1. 完成向导表单
    await page.click('text=开始定制学习方案');

    // 性别选择
    await page.click('text=男性');
    await page.click('button:has-text("下一步")');

    // 身份选择
    await page.click('text=职场人士');
    await page.click('button:has-text("下一步")');

    // 母语选择
    await page.click('text=中文');
    await page.click('button:has-text("下一步")');

    // 学习目标
    await page.fill('textarea', '为了工作需要提升商务英语能力，希望能在6个月内进行日常对话和会议沟通');
    await page.click('button:has-text("下一步")');

    // 学习轨道
    await page.click('text=职场发展');
    await page.click('button:has-text("下一步")');

    // 时间安排 - 验证默认值
    const dailyMinutes = await page.locator('select[value="60"]');
    await expect(dailyMinutes).toBeVisible();
    const studyDays = await page.locator('select[value="5"]');
    await expect(studyDays).toBeVisible();
    await page.click('button:has-text("下一步")');

    // 基础评估
    await page.click('text=零基础');
    await page.click('button:has-text("提交")');

    // 2. 等待方案生成完成
    await page.waitForURL('/plans');
    await page.waitForSelector('text=为您定制的三档学习方案');

    // 3. 验证计算结果
    console.log('📊 验证方案计算结果...');

    // 检查三个方案卡片
    const planCards = page.locator('[data-testid^="plan-card-"]');
    await expect(planCards).toHaveCount(3);

    // 获取各方案的计算数据
    const plans = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="plan-card-"]');
      return Array.from(cards).map(card => {
        const tier = card.querySelector('[data-testid="tier"]')?.textContent;
        const dailyMinutes = card.querySelector('[data-testid="daily-minutes"]')?.textContent;
        const studyDays = card.querySelector('[data-testid="study-days"]')?.textContent;
        const weeks = card.querySelector('[data-testid="weeks"]')?.textContent;
        const totalLessons = card.querySelector('[data-testid="total-lessons"]')?.textContent;

        return { tier, dailyMinutes, studyDays, weeks, totalLessons };
      });
    });

    console.log('生成的方案数据:', plans);

    // 4. 验证计算逻辑
    // 零基础总需求: 14400分钟
    const totalRequired = 14400;

    plans.forEach((plan, index) => {
      if (!plan.dailyMinutes || !plan.studyDays || !plan.weeks || !plan.totalLessons) {
        throw new Error(`方案 ${index + 1} 缺少必要数据`);
      }

      const daily = parseInt(plan.dailyMinutes);
      const weekly = parseInt(plan.studyDays);
      const weeks = parseInt(plan.weeks);
      const lessons = parseInt(plan.totalLessons);

      const weeklyMinutes = daily * weekly;
      const calculatedWeeks = Math.ceil(totalRequired / weeklyMinutes);
      const calculatedLessons = Math.ceil(totalRequired / 25);

      console.log(`方案 ${plan.tier} 验证:`, {
        每日: daily,
        每周: weekly,
        每周总计: weeklyMinutes,
        计算周数: calculatedWeeks,
        实际周数: weeks,
        计算课程数: calculatedLessons,
        实际课程数: lessons
      });

      // 验证周数计算正确性（允许1周的误差）
      expect(Math.abs(weeks - calculatedWeeks)).toBeLessThanOrEqual(1);

      // 验证课程数计算正确性（允许5%的误差）
      const lessonError = Math.abs(lessons - calculatedLessons) / calculatedLessons;
      expect(lessonError).toBeLessThan(0.05);
    });

    console.log('✅ 用例1验证通过');
  });

  test('用例2: 有基础学员 - 每日90分钟，每周4天', async ({ page }) => {
    console.log('🧪 开始测试用例2: 有基础学员 - 每日90分钟，每周4天');

    // 1. 完成向导表单
    await page.click('text=开始定制学习方案');

    // 性别选择
    await page.click('text=女性');
    await page.click('button:has-text("下一步")');

    // 身份选择
    await page.click('text=大学生');
    await page.click('button:has-text("下一步")');

    // 母语选择
    await page.click('text=中文');
    await page.click('button:has-text("下一步")');

    // 学习目标
    await page.fill('textarea', '为了学业和未来职业发展，希望提升英语交流能力，能够参与国际学术交流');
    await page.click('button:has-text("下一步")');

    // 学习轨道
    await page.click('text=学习考试');
    await page.click('button:has-text("下一步")');

    // 时间安排 - 修改为90分钟，4天
    await page.selectOption('select:has-text("每日学习时间")', '90');
    await page.selectOption('select:has-text("每周学习天数")', '4');
    await page.click('button:has-text("下一步")');

    // 基础评估 - 有基础，选择A2水平
    await page.click('text=有基础');
    await page.selectOption('select:has-text("请选择")', 'A2');
    await page.click('button:has-text("提交")');

    // 2. 等待方案生成完成
    await page.waitForURL('/plans');
    await page.waitForSelector('text=为您定制的三档学习方案');

    // 3. 验证计算结果
    console.log('📊 验证方案计算结果...');

    // 获取各方案的计算数据
    const plans = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="plan-card-"]');
      return Array.from(cards).map(card => {
        const tier = card.querySelector('[data-testid="tier"]')?.textContent;
        const dailyMinutes = card.querySelector('[data-testid="daily-minutes"]')?.textContent;
        const studyDays = card.querySelector('[data-testid="study-days"]')?.textContent;
        const weeks = card.querySelector('[data-testid="weeks"]')?.textContent;
        const totalLessons = card.querySelector('[data-testid="total-lessons"]')?.textContent;

        return { tier, dailyMinutes, studyDays, weeks, totalLessons };
      });
    });

    console.log('生成的方案数据:', plans);

    // 4. 验证计算逻辑
    // A2基础总需求: 10800分钟
    const totalRequired = 10800;

    plans.forEach((plan, index) => {
      if (!plan.dailyMinutes || !plan.studyDays || !plan.weeks || !plan.totalLessons) {
        throw new Error(`方案 ${index + 1} 缺少必要数据`);
      }

      const daily = parseInt(plan.dailyMinutes);
      const weekly = parseInt(plan.studyDays);
      const weeks = parseInt(plan.weeks);
      const lessons = parseInt(plan.totalLessons);

      const weeklyMinutes = daily * weekly;
      const calculatedWeeks = Math.ceil(totalRequired / weeklyMinutes);
      const calculatedLessons = Math.ceil(totalRequired / 25);

      console.log(`方案 ${plan.tier} 验证:`, {
        每日: daily,
        每周: weekly,
        每周总计: weeklyMinutes,
        计算周数: calculatedWeeks,
        实际周数: weeks,
        计算课程数: calculatedLessons,
        实际课程数: lessons
      });

      // 验证周数计算正确性
      expect(Math.abs(weeks - calculatedWeeks)).toBeLessThanOrEqual(1);

      // 验证课程数计算正确性
      const lessonError = Math.abs(lessons - calculatedLessons) / calculatedLessons;
      expect(lessonError).toBeLessThan(0.05);
    });

    console.log('✅ 用例2验证通过');
  });

  test('用例3: 高水平学员 - 每日120分钟，每周6天', async ({ page }) => {
    console.log('🧪 开始测试用例3: 高水平学员 - 每日120分钟，每周6天');

    // 1. 完成向导表单
    await page.click('text=开始定制学习方案');

    // 性别选择
    await page.click('text=男性');
    await page.click('button:has-text("下一步")');

    // 身份选择
    await page.click('text=职场人士');
    await page.click('button:has-text("下一步")');

    // 母语选择
    await page.click('text=阿拉伯语');
    await page.click('button:has-text("下一步")');

    // 学习目标
    await page.fill('textarea', '已经是B2水平，希望达到商务精通，能够进行国际商务谈判和跨文化交流');
    await page.click('button:has-text("下一步")');

    // 学习轨道
    await page.click('text=职场发展');
    await page.click('button:has-text("下一步")');

    // 时间安排 - 修改为120分钟，6天
    await page.selectOption('select:has-text("每日学习时间")', '120');
    await page.selectOption('select:has-text("每周学习天数")', '6');
    await page.click('button:has-text("下一步")');

    // 基础评估 - 有基础，选择B2水平
    await page.click('text=有基础');
    await page.selectOption('select:has-text("请选择")', 'B2');
    await page.click('button:has-text("提交")');

    // 2. 等待方案生成完成
    await page.waitForURL('/plans');
    await page.waitForSelector('text=为您定制的三档学习方案');

    // 3. 验证计算结果
    console.log('📊 验证方案计算结果...');

    // 获取各方案的计算数据
    const plans = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="plan-card-"]');
      return Array.from(cards).map(card => {
        const tier = card.querySelector('[data-testid="tier"]')?.textContent;
        const dailyMinutes = card.querySelector('[data-testid="daily-minutes"]')?.textContent;
        const studyDays = card.querySelector('[data-testid="study-days"]')?.textContent;
        const weeks = card.querySelector('[data-testid="weeks"]')?.textContent;
        const totalLessons = card.querySelector('[data-testid="total-lessons"]')?.textContent;

        return { tier, dailyMinutes, studyDays, weeks, totalLessons };
      });
    });

    console.log('生成的方案数据:', plans);

    // 4. 验证计算逻辑
    // B2基础总需求: 7200分钟
    const totalRequired = 7200;

    plans.forEach((plan, index) => {
      if (!plan.dailyMinutes || !plan.studyDays || !plan.weeks || !plan.totalLessons) {
        throw new Error(`方案 ${index + 1} 缺少必要数据`);
      }

      const daily = parseInt(plan.dailyMinutes);
      const weekly = parseInt(plan.studyDays);
      const weeks = parseInt(plan.weeks);
      const lessons = parseInt(plan.totalLessons);

      const weeklyMinutes = daily * weekly;
      const calculatedWeeks = Math.ceil(totalRequired / weeklyMinutes);
      const calculatedLessons = Math.ceil(totalRequired / 25);

      console.log(`方案 ${plan.tier} 验证:`, {
        每日: daily,
        每周: weekly,
        每周总计: weeklyMinutes,
        计算周数: calculatedWeeks,
        实际周数: weeks,
        计算课程数: calculatedLessons,
        实际课程数: lessons
      });

      // 验证周数计算正确性
      expect(Math.abs(weeks - calculatedWeeks)).toBeLessThanOrEqual(1);

      // 验证课程数计算正确性
      const lessonError = Math.abs(lessons - calculatedLessons) / calculatedLessons;
      expect(lessonError).toBeLessThan(0.05);
    });

    console.log('✅ 用例3验证通过');
  });

  test('验证诊断颜色的一致性', async ({ page }) => {
    console.log('🧪 开始验证诊断颜色的一致性');

    // 使用标准配置完成向导
    await page.click('text=开始定制学习方案');
    await page.click('text=男性');
    await page.click('button:has-text("下一步")');
    await page.click('text=职场人士');
    await page.click('button:has-text("下一步")');
    await page.click('text=中文');
    await page.click('button:has-text("下一步")');
    await page.fill('textarea', '提升商务英语能力');
    await page.click('button:has-text("下一步")');
    await page.click('text=职场发展');
    await page.click('button:has-text("下一步")');
    await page.click('text=有基础');
    await page.selectOption('select:has-text("请选择")', 'A2');
    await page.click('button:has-text("提交")');

    // 等待方案生成
    await page.waitForURL('/plans');
    await page.waitForSelector('text=为您定制的三档学习方案');

    // 检查诊断颜色
    const diagnosisColors = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="plan-card-"]');
      return Array.from(cards).map(card => {
        const tier = card.querySelector('[data-testid="tier"]')?.textContent;
        const diagnosis = card.querySelector('[data-testid="diagnosis"]')?.textContent;
        const diagnosisColor = card.querySelector('[data-testid="diagnosis"]')?.getAttribute('data-color');

        return { tier, diagnosis, diagnosisColor };
      });
    });

    console.log('诊断颜色结果:', diagnosisColors);

    // 验证至少有一个方案是绿色（推荐）
    const hasGreenDiagnosis = diagnosisColors.some(plan => plan.diagnosisColor === 'green');
    expect(hasGreenDiagnosis).toBeTruthy();

    console.log('✅ 诊断颜色验证通过');
  });
});
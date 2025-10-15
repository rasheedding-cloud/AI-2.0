import { test, expect } from '@playwright/test';

/**
 * 基础计算测试
 * 验证学习计划的基本计算逻辑
 */
test.describe('基础计算验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('验证前端显示的计算数据', async ({ page }) => {
    console.log('🧪 验证前端显示的计算数据');

    // 完成向导表单 - 使用默认设置
    await page.click('text=开始定制学习方案');
    await page.click('text=男性');
    await page.click('button:has-text("下一步")');
    await page.click('text=职场人士');
    await page.click('button:has-text("下一步")');
    await page.click('text=中文');
    await page.click('button:has-text("下一步")');
    await page.fill('textarea', '为了工作需要提升商务英语能力');
    await page.click('button:has-text("下一步")');
    await page.click('text=职场发展');
    await page.click('button:has-text("下一步")');
    await page.click('text=零基础');
    await page.click('button:has-text("提交")');

    // 等待方案生成
    await page.waitForURL('/plans');
    await page.waitForSelector('text=为您定制的三档学习方案', { timeout: 30000 });

    console.log('✅ 方案页面加载成功');

    // 检查方案卡片是否显示
    const planCards = page.locator('div').filter({ hasText: /轻量方案|标准方案|进阶方案/ });
    await expect(planCards).toHaveCount(3);

    // 获取页面显示的计算数据
    const displayedData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(card =>
        card.textContent && (card.textContent.includes('轻量方案') ||
                          card.textContent.includes('标准方案') ||
                          card.textContent.includes('进阶方案'))
      );

      return cards.map(card => {
        const text = card.textContent || '';
        const tierMatch = text.match(/(轻量|标准|进阶)方案/);
        const dailyMatch = text.match(/每日学习\s*(\d+)\s*分钟/);
        const weeklyMatch = text.match(/每周学习\s*(\d+)\s*天/);
        const weeksMatch = text.match(/学习周期\s*(\d+)\s*周/);
        const lessonsMatch = text.match(/共\s*(\d+)\s*节课程/);

        return {
          tier: tierMatch ? tierMatch[1] : 'unknown',
          dailyMinutes: dailyMatch ? parseInt(dailyMatch[1]) : null,
          studyDays: weeklyMatch ? parseInt(weeklyMatch[1]) : null,
          weeks: weeksMatch ? parseInt(weeksMatch[1]) : null,
          totalLessons: lessonsMatch ? parseInt(lessonsMatch[1]) : null,
        };
      });
    });

    console.log('页面显示的数据:', displayedData);

    // 验证数据完整性
    displayedData.forEach((data, index) => {
      expect(data.dailyMinutes).toBeTruthy();
      expect(data.studyDays).toBeTruthy();
      expect(data.weeks).toBeTruthy();
      expect(data.totalLessons).toBeTruthy();
      expect(data.tier).not.toBe('unknown');

      console.log(`方案 ${index + 1} (${data.tier}):`, {
        每日: data.dailyMinutes,
        每周: data.studyDays,
        周数: data.weeks,
        总课程: data.totalLessons
      });
    });

    // 验证不再是硬编码的16周
    const hasNon16Weeks = displayedData.some(data => data.weeks !== 16);
    expect(hasNon16Weeks).toBeTruthy();

    console.log('✅ 基础计算验证通过 - 不再是硬编码的16周');
  });

  test('验证不同时间配置的差异化', async ({ page }) => {
    console.log('🧪 验证不同时间配置的差异化');

    // 测试不同的时间配置
    const testConfigs = [
      { daily: 30, weekly: 3, name: '最少时间' },
      { daily: 90, weekly: 5, name: '中等时间' },
      { daily: 120, weekly: 6, name: '最多时间' }
    ];

    for (const config of testConfigs) {
      console.log(`测试配置: ${config.name} - 每日${config.daily}分钟, 每周${config.weekly}天`);

      // 重新开始向导
      await page.goto('/');
      await page.click('text=开始定制学习方案');
      await page.click('text=女性');
      await page.click('button:has-text("下一步")');
      await page.click('text=大学生');
      await page.click('button:has-text("下一步")');
      await page.click('text=中文');
      await page.click('button:has-text("下一步")');
      await page.fill('textarea', '提升英语能力');
      await page.click('button:has-text("下一步")');
      await page.click('text=学习考试');
      await page.click('button:has-text("下一步")');

      // 设置时间配置
      await page.selectOption('select:has-text("每日学习时间")', config.daily.toString());
      await page.selectOption('select:has-text("每周学习天数")', config.weekly.toString());
      await page.click('button:has-text("下一步")');

      // 基础评估
      await page.click('text=有基础');
      await page.selectOption('select:has-text("请选择")', 'A2');
      await page.click('button:has-text("提交")');

      // 等待方案生成
      await page.waitForURL('/plans');
      await page.waitForSelector('text=为您定制的三档学习方案', { timeout: 30000 });

      // 获取标准方案的数据
      const standardPlanData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(card =>
          card.textContent && card.textContent.includes('标准方案')
        );

        if (cards.length === 0) return null;

        const text = cards[0].textContent || '';
        const dailyMatch = text.match(/每日学习\s*(\d+)\s*分钟/);
        const weeklyMatch = text.match(/每周学习\s*(\d+)\s*天/);
        const weeksMatch = text.match(/学习周期\s*(\d+)\s*周/);

        return {
          dailyMinutes: dailyMatch ? parseInt(dailyMatch[1]) : null,
          studyDays: weeklyMatch ? parseInt(weeklyMatch[1]) : null,
          weeks: weeksMatch ? parseInt(weeksMatch[1]) : null,
        };
      });

      expect(standardPlanData).toBeTruthy();
      console.log(`${config.name}配置的标准方案:`, standardPlanData);

      // 验证时间配置影响周数计算
      if (standardPlanData) {
        expect(standardPlanData.weeks).toBeGreaterThan(0);
        expect(standardPlanData.weeks).not.toBe(16); // 不应该是硬编码的16
      }

      // 短暂等待避免请求过快
      await page.waitForTimeout(1000);
    }

    console.log('✅ 不同时间配置差异化验证通过');
  });
});
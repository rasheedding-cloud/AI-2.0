/**
 * 计算验证脚本
 * 验证三个典型用例的计算结果
 */

// 导入我们的计算函数
const {
  generateThreeTiers,
  totalMinutesRequired,
  weeksNeeded,
  totalLessonsRequired
} = require('../src/lib/calc/time.ts');

// 三个测试用例
const testCases = [
  {
    name: '用例1: 零基础职场人士',
    intake: {
      zero_base: true,
      daily_minutes_pref: 60,
      study_days_per_week: 5,
      cultural_mode: 'gcc',
      track_override: 'work'
    },
    expected: {
      description: '零基础到职场沟通，每日60分钟，每周5天',
      totalMinutes: 14400, // 240小时 * 60分钟
      standardWeeklyMinutes: 300, // 60 * 5
      expectedWeeks: 48, // Math.ceil(14400 / 300)
      expectedLessons: 576 // Math.ceil(14400 / 25)
    }
  },
  {
    name: '用例2: A2基础大学生',
    intake: {
      zero_base: false,
      self_assessed_level: 'A2',
      daily_minutes_pref: 90,
      study_days_per_week: 4,
      cultural_mode: 'gcc',
      track_override: 'study'
    },
    expected: {
      description: 'A2基础到学业应用，每日90分钟，每周4天',
      totalMinutes: 10800, // 180小时 * 60分钟
      standardWeeklyMinutes: 360, // 90 * 4
      expectedWeeks: 30, // Math.ceil(10800 / 360)
      expectedLessons: 432 // Math.ceil(10800 / 25)
    }
  },
  {
    name: '用例3: B2基础高强度学习者',
    intake: {
      zero_base: false,
      self_assessed_level: 'B2',
      daily_minutes_pref: 120,
      study_days_per_week: 6,
      cultural_mode: 'gcc',
      track_override: 'work'
    },
    expected: {
      description: 'B2基础到商务精通，每日120分钟，每周6天',
      totalMinutes: 7200, // 120小时 * 60分钟
      standardWeeklyMinutes: 720, // 120 * 6
      expectedWeeks: 10, // Math.ceil(7200 / 720)
      expectedLessons: 288 // Math.ceil(7200 / 25)
    }
  }
];

console.log('🧮 开始验证学习计划计算逻辑\n');

testCases.forEach((testCase, index) => {
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`描述: ${testCase.expected.description}`);

  try {
    // 生成三档方案
    const tiers = generateThreeTiers(testCase.intake);

    console.log('\n📊 计算结果:');
    console.log('总需求分钟数:', testCase.expected.totalMinutes);

    ['light', 'standard', 'intensive'].forEach(tierName => {
      const plan = tiers[tierName];
      const weeklyMinutes = plan.daily_minutes * plan.days_per_week;
      const calculatedWeeks = Math.ceil(testCase.expected.totalMinutes / weeklyMinutes);
      const calculatedLessons = Math.ceil(testCase.expected.totalMinutes / 25);

      console.log(`\n${tierName.toUpperCase()} 方案:`);
      console.log(`  每日: ${plan.daily_minutes} 分钟`);
      console.log(`  每周: ${plan.days_per_week} 天`);
      console.log(`  每周总计: ${weeklyMinutes} 分钟`);
      console.log(`  计算周数: ${calculatedWeeks} 周`);
      console.log(`  实际周数: ${plan.weeks} 周`);
      console.log(`  周数差异: ${Math.abs(plan.weeks - calculatedWeeks)} 周`);
      console.log(`  计算课程数: ${calculatedLessons} 课`);
      console.log(`  实际课程数: ${plan.lessons_total} 课`);
      console.log(`  课程数差异: ${Math.abs(plan.lessons_total - calculatedLessons)} 课`);

      // 验证计算准确性
      const weekError = Math.abs(plan.weeks - calculatedWeeks);
      const lessonError = Math.abs(plan.lessons_total - calculatedLessons);

      if (weekError <= 1) {
        console.log(`  ✅ 周数计算准确 (误差≤1周)`);
      } else {
        console.log(`  ❌ 周数计算不准确 (误差=${weekError}周)`);
      }

      if (lessonError <= 5) {
        console.log(`  ✅ 课程数计算准确 (误差≤5课)`);
      } else {
        console.log(`  ❌ 课程数计算不准确 (误差=${lessonError}课)`);
      }
    });

    console.log('\n' + '='.repeat(50));

  } catch (error) {
    console.error(`❌ 计算失败:`, error.message);
  }
});

console.log('\n🎯 验证完成！');

// 验证不再有硬编码的16周
console.log('\n🔍 检查是否还有硬编码的16周...');
testCases.forEach(testCase => {
  try {
    const tiers = generateThreeTiers(testCase.intake);
    const has16Weeks = Object.values(tiers).some(plan => plan.weeks === 16);
    if (has16Weeks) {
      console.log(`❌ ${testCase.name} 仍有16周硬编码`);
    } else {
      console.log(`✅ ${testCase.name} 已移除16周硬编码`);
    }
  } catch (error) {
    console.log(`⚠️ ${testCase.name} 检查失败:`, error.message);
  }
});

module.exports = { testCases };
#!/usr/bin/env tsx

/**
 * QuickPlacement 题库安全热修脚本
 * 安全模式：只检查问题，不自动修改
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

interface IssueReport {
  type: 'error' | 'warning';
  category: string;
  description: string;
  file: string;
  line?: number;
  suggestion?: string;
}

class QuickPlacementSafeChecker {
  private issues: IssueReport[] = [];
  private qbBankPath: string;

  constructor() {
    this.qbBankPath = path.join(projectRoot, 'src/server/services/placement/qb_bank.ts');
    console.log('🔍 QuickPlacement 题库安全检查工具启动...\n');
  }

  /**
   * 执行所有检查
   */
  async check(): Promise<void> {
    try {
      // 1. 检查文件是否存在
      await this.checkFileExists();

      // 2. 检查基本结构
      await this.checkBasicStructure();

      // 3. 检查导入语句
      await this.checkImports();

      // 4. 检查数据结构
      await this.checkDataStructure();

      // 5. 检查防泄题规则
      await this.checkAntiLeakage();

      // 6. 生成检查报告
      await this.generateReport();

      console.log('\n🎉 安全检查完成！');
    } catch (error) {
      console.error('❌ 安全检查失败:', error);
      process.exit(1);
    }
  }

  /**
   * 检查文件是否存在
   */
  private async checkFileExists(): Promise<void> {
    if (!fs.existsSync(this.qbBankPath)) {
      this.issues.push({
        type: 'error',
        category: '文件检查',
        description: `题库文件不存在: ${this.qbBankPath}`,
        file: this.qbBankPath,
        suggestion: '请确认题库文件路径是否正确'
      });
    } else {
      console.log('✅ 题库文件存在');
    }
  }

  /**
   * 检查基本结构
   */
  private async checkBasicStructure(): Promise<void> {
    if (!fs.existsSync(this.qbBankPath)) return;

    const content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 检查是否包含必要的导出
    const requiredExports = [
      'export const OBJECTIVES',
      'export const SCENE_ANCHORS',
      'export type Track',
      'export type Skill',
      'export type Band'
    ];

    requiredExports.forEach(exportName => {
      if (!content.includes(exportName)) {
        this.issues.push({
          type: 'error',
          category: '结构检查',
          description: `缺少必要的导出: ${exportName}`,
          file: this.qbBankPath,
          suggestion: `请添加 ${exportName} 导出`
        });
      }
    });

    console.log('✅ 基本结构检查完成');
  }

  /**
   * 检查导入语句
   */
  private async checkImports(): Promise<void> {
    if (!fs.existsSync(this.qbBankPath)) return;

    const content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 检查是否导入了验证函数
    if (!content.includes('validateQBankContract')) {
      this.issues.push({
        type: 'warning',
        category: '导入检查',
        description: '未导入运行时验证函数',
        file: this.qbBankPath,
        suggestion: '建议导入 validateQBankContract 以启用运行时验证'
      });
    }

    console.log('✅ 导入语句检查完成');
  }

  /**
   * 检查数据结构
   */
  private async checkDataStructure(): Promise<void> {
    if (!fs.existsSync(this.qbBankPath)) return;

    const content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 检查 OBJECTIVES 结构
    const objectivesMatch = content.match(/export const OBJECTIVES = ({[\s\S]*?});/);
    if (objectivesMatch) {
      // 检查是否包含必要的字段
      const objectivesData = objectivesMatch[1];

      // 检查是否有 scored 字段
      if (!objectivesData.includes('scored:')) {
        this.issues.push({
          type: 'warning',
          category: '数据结构',
          description: 'OBJECTIVES 中的题目可能缺少 scored 字段',
          file: this.qbBankPath,
          suggestion: '为每个题目添加 scored: true/false 字段'
        });
      }

      // 检查是否有正确的正确答案格式
      if (objectivesData.includes('correctAnswer')) {
        this.issues.push({
          type: 'error',
          category: '数据结构',
          description: '检测到错误的字段名 correctAnswer，应为 correct',
          file: this.qbBankPath,
          suggestion: '将 correctAnswer 改为 correct'
        });
      }
    }

    // 检查 SCENE_ANCHORS 结构
    const anchorsMatch = content.match(/export const SCENE_ANCHORS: SceneAnchor\[] = \[([\s\S]*?)\];/);
    if (anchorsMatch) {
      const anchorsData = anchorsMatch[1];

      // 统计各等级数量
      const a1Count = (anchorsData.match(/band_hint:\s*"A1"/g) || []).length;
      const a2Count = (anchorsData.match(/band_hint:\s*"A2"/g) || []).length;
      const b1MinusCount = (anchorsData.match(/band_hint:\s*"B1-"/g) || []).length;

      const requirements = { A1: 4, A2: 6, 'B1-': 6 };

      Object.entries(requirements).forEach(([level, required]) => {
        const actual = level === 'A1' ? a1Count : level === 'A2' ? a2Count : b1MinusCount;
        if (actual < required) {
          this.issues.push({
            type: 'warning',
            category: '数据结构',
            description: `${level} 场景锚点数量不足: ${actual}/${required}`,
            file: this.qbBankPath,
            suggestion: `至少需要 ${required} 个 ${level} 场景锚点`
          });
        }
      });
    }

    console.log('✅ 数据结构检查完成');
  }

  /**
   * 检查防泄题规则
   */
  private async checkAntiLeakage(): Promise<void> {
    if (!fs.existsSync(this.qbBankPath)) return;

    const content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 检查是否有明显的答案泄露
    const suspiciousPatterns = [
      { pattern: /correctAnswer/g, description: '错误的答案字段名' },
      { pattern: /answer.*hint/gi, description: '可能的答案提示' },
      { pattern: /data-correct/g, description: '可能的正确答案标记' }
    ];

    suspiciousPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          type: 'warning',
          category: '防泄题检查',
          description: `发现可疑模式: ${description} (${matches.length} 处)`,
          file: this.qbBankPath,
          suggestion: '检查并移除可能的答案泄露'
        });
      }
    });

    console.log('✅ 防泄题规则检查完成');
  }

  /**
   * 生成检查报告
   */
  private async generateReport(): Promise<void> {
    const reportPath = path.join(projectRoot, 'docs/QP_SAFE_CHECK_REPORT.md');

    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;

    const report = `# QuickPlacement 题库安全检查报告

## 检查时间
${new Date().toLocaleString('zh-CN')}

## 检查统计
- 错误数量: ${errorCount}
- 警告数量: ${warningCount}
- 总问题数: ${this.issues.length}

## 问题详情

${this.issues.map((issue, index) => `
### ${index + 1}. ${issue.description}

- **类型**: ${issue.type === 'error' ? '❌ 错误' : '⚠️ 警告'}
- **类别**: ${issue.category}
- **文件**: \`${issue.file}\`
${issue.line ? `- **行号**: ${issue.line}` : ''}
${issue.suggestion ? `- **建议**: ${issue.suggestion}` : ''}

`).join('')}

## 总结

${errorCount === 0 && warningCount === 0 ?
  '🎉 未发现任何问题，题库状态良好！' :
  errorCount > 0 ?
    `❌ 发现 ${errorCount} 个错误需要修复，${warningCount} 个警告建议处理` :
    `⚠️ 发现 ${warningCount} 个警告建议处理`
}

## 修复建议

1. **优先修复错误**: 错误类型的问题必须修复才能正常运行
2. **处理警告**: 警告类型的问题建议处理以提高代码质量
3. **运行验证**: 修复后运行 \`npm run validate:qb\` 验证
4. **测试确认**: 运行 \`npm run test:contract\` 确认契约测试通过

---

*此报告由安全检查脚本自动生成*
`;

    // 确保目录存在
    const docsDir = path.dirname(reportPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`📄 检查报告已生成: ${reportPath}`);

    // 输出摘要
    console.log('\n📊 检查摘要:');
    console.log(`  - 错误: ${errorCount}`);
    console.log(`  - 警告: ${warningCount}`);

    if (errorCount > 0) {
      console.log('\n❌ 请修复以上错误后重新运行检查');
    } else if (warningCount > 0) {
      console.log('\n⚠️ 建议处理以上警告以提高代码质量');
    } else {
      console.log('\n🎉 题库状态良好，未发现问题！');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const checker = new QuickPlacementSafeChecker();
  await checker.check();
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 安全检查脚本执行失败:', error);
    process.exit(1);
  });
}

export { QuickPlacementSafeChecker, IssueReport };
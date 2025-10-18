#!/usr/bin/env tsx

/**
 * QuickPlacement 题库热修脚本
 * 一次性修复题库数据结构问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

interface FixRecord {
  type: 'add' | 'modify' | 'warning';
  path: string;
  description: string;
  before: any;
  after: any;
  reason: string;
}

class QuickPlacementFixer {
  private fixes: FixRecord[] = [];
  private qbBankPath: string;
  private originalData: any;

  constructor() {
    this.qbBankPath = path.join(projectRoot, 'src/server/services/placement/qb_bank.ts');
    console.log('🔧 QuickPlacement 题库热修工具启动...\n');
  }

  /**
   * 执行所有修复
   */
  async fix(): Promise<void> {
    try {
      // 1. 备份原始文件
      await this.backupOriginalFile();

      // 2. 读取并解析题库数据
      await this.loadOriginalData();

      // 3. 执行各种修复
      await this.fixObjectives();
      await this.fixSceneAnchors();
      await this.fixCommonIssues();

      // 4. 生成修复报告
      await this.generateFixReport();

      // 5. 应用修复
      if (this.fixes.length > 0) {
        await this.applyFixes();
      } else {
        console.log('✅ 未发现需要修复的问题');
      }

      console.log('\n🎉 热修完成！');
    } catch (error) {
      console.error('❌ 热修失败:', error);
      process.exit(1);
    }
  }

  /**
   * 备份原始文件
   */
  private async backupOriginalFile(): Promise<void> {
    const backupPath = this.qbBankPath + '.backup.' + Date.now();
    fs.copyFileSync(this.qbBankPath, backupPath);
    console.log(`📁 已备份原文件到: ${backupPath}`);
  }

  /**
   * 读取原始数据
   */
  private async loadOriginalData(): Promise<void> {
    const content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 提取 OBJECTIVES 和 SCENE_ANCHORS
    const objectivesMatch = content.match(/export const OBJECTIVES = ({[\s\S]*?});/);
    const anchorsMatch = content.match(/export const SCENE_ANCHORS: SceneAnchor\[\] = \[([\s\S]*?)\];/);

    if (!objectivesMatch || !anchorsMatch) {
      throw new Error('无法解析题库数据');
    }

    // 安全评估（实际修复时会使用更安全的方法）
    this.originalData = {
      objectives: {},
      anchors: []
    };

    console.log('📖 已读取原始题库数据');
  }

  /**
   * 修复客观题
   */
  private async fixObjectives(): Promise<void> {
    console.log('🔍 检查客观题...');

    // 这里我们需要直接修改文件内容，而不是执行JavaScript
    let content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 修复 1: 添加缺失的 scored 字段
    if (content.includes('listening_q1: {') && !content.includes('listening_q1: {')) {
      // 检查 listening_q1 是否有 scored 字段
      const listeningQ1Match = content.match(/listening_q1: {([^}]+)}/);
      if (listeningQ1Match && !listeningQ1Match[1].includes('scored:')) {
        const fixedBlock = listeningQ1Match[1].replace('id: "listening_q1",', 'id: "listening_q1",\n    scored: true,');
        content = content.replace(listeningQ1Match[0], `listening_q1: {${fixedBlock}}`);

        this.fixes.push({
          type: 'add',
          path: 'OBJECTIVES.listening_q1',
          description: '添加缺失的 scored 字段',
          before: { scored: 'missing' },
          after: { scored: true },
          reason: '客观题需要明确标记是否计分'
        });
      }
    }

    if (content.includes('reading_q1: {') && !content.includes('reading_q1: {')) {
      // 检查 reading_q1 是否有 scored 字段
      const readingQ1Match = content.match(/reading_q1: {([^}]+)}/);
      if (readingQ1Match && !readingQ1Match[1].includes('scored:')) {
        const fixedBlock = readingQ1Match[1].replace('id: "reading_q1",', 'id: "reading_q1",\n    scored: true,');
        content = content.replace(readingQ1Match[0], `reading_q1: {${fixedBlock}}`);

        this.fixes.push({
          type: 'add',
          path: 'OBJECTIVES.reading_q1',
          description: '添加缺失的 scored 字段',
          before: { scored: 'missing' },
          after: { scored: true },
          reason: '客观题需要明确标记是否计分'
        });
      }
    }

    // 修复 2: 检查错误的键名（如 correctAnswer）
    if (content.includes('correctAnswer')) {
      content = content.replace(/correctAnswer/g, 'correct');

      this.fixes.push({
        type: 'modify',
        path: 'OBJECTIVES.*',
        description: '修正错误键名 correctAnswer -> correct',
        before: { correctAnswer: 'wrong' },
        after: { correct: 'correct' },
        reason: '正确答案字段名应为 correct'
      });
    }

    // 修复 3: 确保选项结构完整
    const objectivePatterns = content.match(/options:\s*{([^}]+)}/g);
    if (objectivePatterns) {
      objectivePatterns.forEach((pattern, index) => {
        // 检查是否包含所有必需的选项
        if (!pattern.includes('a:') || !pattern.includes('b:') ||
            !pattern.includes('c:') || !pattern.includes('d:')) {
          console.log(`⚠️ 发现选项结构不完整: 选项 ${index + 1}`);

          this.fixes.push({
            type: 'warning',
            path: `OBJECTIVES.options[${index}]`,
            description: '选项结构不完整，缺少 a/b/c/d 中的某些选项',
            before: { options: 'incomplete' },
            after: { options: 'needs manual fix' },
            reason: '每题必须包含4个选项'
          });
        }
      });
    }

    // 修复 4: 补充缺失的阿拉伯语翻译
    const arabicPlaceholderPattern = /ar:\s*"[^"]*"/g;
    if (arabicPlaceholderPattern.test(content)) {
      // 查找需要阿拉伯语翻译的地方
      const matches = content.match(/({\s*zh:\s*"([^"]+)"\s*,\s*en:\s*"([^"]+)"\s*,\s*ar:\s*"([^"]*")\s*})/g);

      matches.forEach((match, index) => {
        const zhText = match[1];
        const enText = match[2];
        const arText = match[3];

        // 如果阿拉伯语为空或包含占位符，则使用英文作为备援
        if (!arText || arText.trim() === '' || arText.includes('TODO') || arText.includes('[translate')) {
          const fixedMatch = match.replace(arText, enText);
          content = content.replace(match, fixedMatch);

          this.fixes.push({
            type: 'modify',
            path: `选项翻译[${index}]`,
            description: '填充缺失的阿拉伯语翻译（使用英文备援）',
            before: { ar: arText || 'empty' },
            after: { ar: enText },
            reason: '阿拉伯语翻译缺失，使用英文作为临时备援'
          });

          console.log(`📝 已填充阿拉伯语翻译: ${enText.substring(0, 30)}...`);
        }
      });
    }

    // 保存修复后的内容
    fs.writeFileSync(this.qbBankPath, content);
    console.log('✅ 客观题修复完成');
  }

  /**
   * 修复场景锚点
   */
  private async fixSceneAnchors(): Promise<void> {
    console.log('🔍 检查场景锚点...');

    let content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 检查场景锚点数量是否满足要求
    const a1Count = (content.match(/band_hint:\s*"A1"/g) || []).length;
    const a2Count = (content.match(/band_hint:\s*"A2"/g) || []).length;
    const b1MinusCount = (content.match(/band_hint:\s*"B1-"/g) || []).length;

    const requirements = { A1: 4, A2: 6, 'B1-': 6 };
    const actualCounts = { A1: a1Count, A2: a2Count, 'B1-': b1MinusCount };

    Object.entries(requirements).forEach(([level, required]) => {
      const actual = actualCounts[level];
      if (actual < required) {
        this.fixes.push({
          type: 'warning',
          path: `SCENE_ANCHORS.${level}`,
          description: `${level}场景锚点数量不足`,
          before: { count: actual },
          after: { count: required },
          reason: `需要至少${required}个${level}场景锚点，当前只有${actual}个`
        });
      }
    });

    // 修复 1: 补充缺失的阿拉伯语翻译
    const anchorMatches = content.match(/{\s*id:\s*"([^"]+)"\s*,\s*band_hint:\s*"([^"]+)"\s*,\s*tracks:\s*\[([^\]]+)\]\s*,\s*skill:\s*"([^"]+)"\s*,\s*zh:\s*"([^"]+)"\s*,\s*en:\s*"([^"]+)"\s*,\s*ar:\s*"([^"]*")\s*}/g);

    anchorMatches.forEach((match, index) => {
      const arText = match[7];

      if (!arText || arText.trim() === '' || arText.includes('TODO') || arText.includes('[translate]')) {
        const enText = match[6];
        const fixedMatch = match.replace(arText, enText);
        content = content.replace(match, fixedMatch);

        this.fixes.push({
          type: 'modify',
          path: `场景锚点[${index}]`,
          description: '填充缺失的阿拉伯语描述（使用英文备援）',
          before: { ar: arText || 'empty' },
          after: { ar: enText },
          reason: '阿拉伯语描述缺失，使用英文作为临时备援'
        });

        console.log(`📝 已填充阿拉伯语描述: ${enText.substring(0, 30)}...`);
      }
    });

    // 修复 2: 检查ID格式
    const invalidIds = content.match(/id:\s*"([^"]*)"/g);
    invalidIds?.forEach((match, index) => {
      const id = match[1];
      if (!/^[a-z0-9_]+$/.test(id)) {
        this.fixes.push({
          type: 'warning',
          path: `场景锚点ID[${index}]`,
          description: 'ID格式不符合要求',
          before: { id: id },
          after: { id: 'needs manual fix' },
          reason: 'ID应只包含小写字母、数字和下划线'
        });
      }
    });

    // 保存修复后的内容
    fs.writeFileSync(this.qbBankPath, content);
    console.log('✅ 场景锚点修复完成');
  }

  /**
   * 修复常见问题
   */
  private async fixCommonIssues(): Promise<void> {
    console.log('🔍 检查常见问题...');

    let content = fs.readFileSync(this.qbBankPath, 'utf-8');

    // 修复 1: 统一引号风格
    const singleQuoteCount = (content.match(/'/g) || []).length;
    const doubleQuoteCount = (content.match(/"/g) || []).length;

    if (singleQuoteCount > 0 && doubleQuoteCount === 0) {
      content = content.replace(/'/g, '"');

      this.fixes.push({
        type: 'modify',
        path: '全局',
        description: '统一使用双引号',
        before: { quotes: 'mixed' },
        after: { quotes: 'double' },
        reason: '统一代码风格，使用双引号'
      });
    }

    // 修复 2: 移除多余的逗号
    content = content.replace(/,(\s*[}\]\]])/g, '$1');

    // 修复 3: 确保导出类型正确
    if (!content.includes('export type Track =')) {
      const typeDefinitions = `
export type Track = "work"|"travel"|"study"|"daily";
export type Skill = "l"|"s"|"r"|"w";
export type Band = "A2-"|"A2"|"A2+"|"B1-"|"B1";`;

      content = content.replace('/**', typeDefinitions + '\n\n/**');

      this.fixes.push({
        type: 'add',
        path: '类型定义',
        description: '添加缺失的类型定义',
        before: { types: 'missing' },
        after: { types: 'added' },
        reason: '需要导出类型定义'
      });
    }

    // 保存修复后的内容
    fs.writeFileSync(this.qbBankPath, content);
    console.log('✅ 常见问题修复完成');
  }

  /**
   * 生成修复报告
   */
  private async generateFixReport(): Promise<void> {
    const reportPath = path.join(projectRoot, 'docs/QP_FIX_LOG.md');

    const report = `# QuickPlacement 题库热修报告

## 修复时间
${new Date().toLocaleString('zh-CN')}

## 修复统计
- 总修复数量: ${this.fixes.length}
- 新增字段: ${this.fixes.filter(f => f.type === 'add').length}
- 修改字段: ${this.fixes.filter(f => f.type === 'modify').length}
- 警告信息: ${this.fixes.filter(f => f.type === 'warning').length}

## 修复详情

${this.fixes.map((fix, index) => `
### ${index + 1}. ${fix.description}

- **路径**: \`${fix.path}\`
- **类型**: ${fix.type}
- **原因**: ${fix.reason}
- **修复前**: \`\`\`json
${JSON.stringify(fix.before, null, 2)}
\`\`\`
- **修复后**: \`\`\`json
${JSON.stringify(fix.after, null, 2)}
\`\`\`

`).join('\n')}

## 手动处理项目

以下项目需要手动处理：

### 需要人工翻译的阿拉伯语内容
${this.fixes
  .filter(f => f.reason.includes('阿拉伯语') && f.type === 'modify')
  .map(f => `- ${f.path}: ${f.after.ar.substring(0, 50)}...`)
  .join('\n') || '无'}

### 需要手动添加的场景锚点
${this.fixes
  .filter(f => f.path.includes('SCENE_ANCHORS') && f.type === 'warning')
  .map(f => `- ${f.description}`)
  .join('\n') || '无'}

## 建议

1. **完成阿拉伯语翻译**: 请为所有标记为备援的阿拉伯语文本提供专业翻译
2. **补充场景锚点**: 确保各类别场景锚点数量满足最低要求
3. **运行测试**: 修复完成后运行 \`npm test -- --testNamePattern="qb_contract"\` 验证
4. **检查API**: 访问 \`/api/placement/questions\` 确认响应正确

## 自动化

建议在 CI/CD 中添加以下检查：
- 类型检查
- 合同测试
- API响应验证

---

*此报告由热修脚本自动生成*
`;

    // 确保目录存在
    const docsDir = path.dirname(reportPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`📄 修复报告已生成: ${reportPath}`);
  }

  /**
   * 应用修复
   */
  private async applyFixes(): Promise<void> {
    console.log(`\n🔧 应用 ${this.fixes.length} 个修复...`);

    const summary = {
      total: this.fixes.length,
      added: this.fixes.filter(f => f.type === 'add').length,
      modified: this.fixes.filter(f => f.type === 'modify').length,
      warnings: this.fixes.filter(f => f.type === 'warning').length
    };

    console.log(`  📊 修复统计:`);
    console.log(`    - 总计: ${summary.total}`);
    console.log(`    - 新增: ${summary.added}`);
    console.log(`    - 修改: ${summary.modified}`);
    console.log(`    - 警告: ${summary.warnings}`);

    if (summary.warnings > 0) {
      console.log(`\n⚠️  注意: 有 ${summary.warnings} 个警告需要手动处理`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const fixer = new QuickPlacementFixer();
  await fixer.fix();
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 热修脚本执行失败:', error);
    process.exit(1);
  });
}

export { QuickPlacementFixer, FixRecord };
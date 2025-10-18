#!/usr/bin/env tsx

/**
 * QuickPlacement 预提交校验脚本
 * 在提交前验证题库契约和防泄题规则
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// 导入题库模块
let OBJECTIVES: any, SCENE_ANCHORS: any;

try {
  const qbModule = await import(path.join(projectRoot, 'src/server/services/placement/qb_bank.ts'));
  OBJECTIVES = qbModule.OBJECTIVES;
  SCENE_ANCHORS = qbModule.SCENE_ANCHORS;
} catch (error) {
  console.error('❌ 无法导入题库模块:', error);
  process.exit(1);
}

// 导入验证函数
let validateQBankContract: any;

try {
  const schemaModule = await import(path.join(projectRoot, 'src/server/services/placement/qb_schema.ts'));
  validateQBankContract = schemaModule.validateQBankContract;
} catch (error) {
  console.error('❌ 无法导入验证函数:', error);
  process.exit(1);
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: any;
}

class QuickPlacementValidator {
  private errors: string[] = [];
  private warnings: string[] = [];
  private stats: any = {};

  constructor() {
    console.log('🔍 QuickPlacement 预提交校验开始...\n');
  }

  /**
   * 运行所有校验
   */
  async validate(): Promise<ValidationResult> {
    // 1. 题库契约校验
    await this.validateQBankContract();

    // 2. 防泄题检查
    await this.validateAntiLeakage();

    // 3. 静态代码分析
    await this.validateStaticCode();

    // 4. 多语言完整性检查
    await this.validateMultilingualCompleteness();

    // 5. 数据结构一致性检查
    await this.validateDataConsistency();

    const success = this.errors.length === 0;

    if (success) {
      console.log('✅ 所有校验通过！');
    } else {
      console.log(`❌ 发现 ${this.errors.length} 个错误：`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} 个警告：`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log('\n📊 校验统计:', this.stats);

    return {
      success,
      errors: this.errors,
      warnings: this.warnings,
      stats: this.stats
    };
  }

  /**
   * 题库契约校验
   */
  private async validateQBankContract(): Promise<void> {
    console.log('📋 校验题库契约...');

    try {
      const result = validateQBankContract(OBJECTIVES, SCENE_ANCHORS);

      if (result.errors.length > 0) {
        this.errors.push(...result.errors.map(error => `契约校验失败: ${error}`));
      }

      this.stats.objectives = result.objectives.length;
      this.stats.sceneAnchors = result.sceneAnchors.length;
      this.stats.contractValidation = '通过';

      console.log('  ✅ 契约校验完成');
    } catch (error) {
      this.errors.push(`契约校验异常: ${error}`);
      this.stats.contractValidation = '失败';
    }
  }

  /**
   * 防泄题检查
   */
  private async validateAntiLeakage(): Promise<void> {
    console.log('🔒 检查防泄题规则...');

    // 检查题目ID是否泄露答案
    Object.values(OBJECTIVES).forEach((item: any, index: number) => {
      const id = item.id.toLowerCase();
      const correctAnswer = item.correct;

      if (id.includes(correctAnswer)) {
        this.errors.push(`题目ID泄露答案: ${item.id} 包含正确答案 ${correctAnswer}`);
      }

      if (id.includes('answer') || id.includes('correct') || id.includes('答案')) {
        this.warnings.push(`题目ID可能泄露信息: ${item.id}`);
      }
    });

    // 检查选项文本是否包含答案提示
    Object.values(OBJECTIVES).forEach((item: any) => {
      const correctOption = item.options[item.correct];

      const suspiciousWords = [
        '正确', '答案', 'correct', 'answer', 'right', 'صحيح', 'إجابة'
      ];

      suspiciousWords.forEach(word => {
        if (correctOption.zh.includes(word) ||
            correctOption.en.toLowerCase().includes(word) ||
            correctOption.ar.includes(word)) {
          this.warnings.push(`选项可能泄露答案: ${item.id} 正确选项包含 "${word}"`);
        }
      });
    });

    this.stats.antiLeakageCheck = '完成';
    console.log('  ✅ 防泄题检查完成');
  }

  /**
   * 静态代码分析
   */
  private async validateStaticCode(): Promise<void> {
    console.log('🔍 执行静态代码分析...');

    const filesToCheck = [
      'src/app/api/placement/questions/route.ts',
      'src/server/services/placement/qb_bank.ts'
    ];

    for (const file of filesToCheck) {
      try {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          await this.analyzeFileForLeaks(file, content);
        }
      } catch (error) {
        this.warnings.push(`无法分析文件 ${file}: ${error}`);
      }
    }

    this.stats.staticAnalysis = '完成';
    console.log('  ✅ 静态代码分析完成');
  }

  /**
   * 分析文件是否存在泄露
   */
  private async analyzeFileForLeaks(fileName: string, content: string): Promise<void> {
    // 检查是否在API响应中包含敏感字段
    if (fileName.includes('questions/route.ts')) {
      const suspiciousPatterns = [
        /correct\s*:/g,
        /scored\s*:/g,
        /level_hint\s*:/g,
        /answer\s*:/g
      ];

      suspiciousPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.errors.push(`${fileName} 可能泄露敏感字段: 发现 ${matches.length} 处 "${pattern.source}"`);
        }
      });

      // 检查是否正确过滤了响应数据
      if (!content.includes('sanitizedQuestions') && !content.includes('filteredQuestions')) {
        this.warnings.push(`${fileName} 未检测到数据过滤逻辑`);
      }
    }

    // 检查 qb_bank.ts 是否正确导入和使用了验证
    if (fileName.includes('qb_bank.ts')) {
      if (!content.includes('validateQBankContract') && !content.includes('validateObjectives')) {
        this.warnings.push(`${fileName} 未使用运行时校验`);
      }
    }
  }

  /**
   * 多语言完整性检查
   */
  private async validateMultilingualCompleteness(): Promise<void> {
    console.log('🌐 检查多语言完整性...');

    let missingTranslations = 0;
    let emptyTranslations = 0;

    // 检查客观题多语言
    Object.values(OBJECTIVES).forEach((item: any, index: number) => {
      Object.entries(item.options).forEach(([key, option]: [string, any]) => {
        ['zh', 'en', 'ar'].forEach(lang => {
          if (!option[lang]) {
            missingTranslations++;
            this.errors.push(`客观题 ${item.id} 选项 ${key} 缺少 ${lang} 翻译`);
          } else if (option[lang].trim() === '') {
            emptyTranslations++;
            this.warnings.push(`客观题 ${item.id} 选项 ${key} 的 ${lang} 翻译为空`);
          }
        });
      });
    });

    // 检查场景锚点多语言
    SCENE_ANCHORS.forEach((anchor: any, index: number) => {
      ['zh', 'en', 'ar'].forEach(lang => {
        if (!anchor[lang]) {
          missingTranslations++;
          this.errors.push(`场景锚点 ${anchor.id} 缺少 ${lang} 描述`);
        } else if (anchor[lang].trim() === '') {
          emptyTranslations++;
          this.warnings.push(`场景锚点 ${anchor.id} 的 ${lang} 描述为空`);
        }
      });
    });

    this.stats.multilingualCheck = '完成';
    this.stats.missingTranslations = missingTranslations;
    this.stats.emptyTranslations = emptyTranslations;

    console.log('  ✅ 多语言检查完成');
  }

  /**
   * 数据结构一致性检查
   */
  private async validateDataConsistency(): Promise<void> {
    console.log('🔧 检查数据结构一致性...');

    let inconsistencies = 0;

    // 检查客观题结构一致性
    Object.values(OBJECTIVES).forEach((item: any, index: number) => {
      // 检查必填字段
      const requiredFields = ['id', 'scored', 'options', 'correct'];
      requiredFields.forEach(field => {
        if (!item[field]) {
          inconsistencies++;
          this.errors.push(`客观题 ${item.id} 缺少必填字段: ${field}`);
        }
      });

      // 检查选项结构
      if (item.options) {
        const optionKeys = Object.keys(item.options);
        if (!optionKeys.includes('a') || !optionKeys.includes('b') ||
            !optionKeys.includes('c') || !optionKeys.includes('d')) {
          inconsistencies++;
          this.errors.push(`客观题 ${item.id} 选项不完整`);
        }
      }

      // 检查正确答案格式
      if (item.correct && !['a', 'b', 'c', 'd'].includes(item.correct)) {
        inconsistencies++;
        this.errors.push(`客观题 ${item.id} 正确答案格式无效: ${item.correct}`);
      }
    });

    // 检查场景锚点结构一致性
    SCENE_ANCHORS.forEach((anchor: any, index: number) => {
      const requiredFields = ['id', 'band_hint', 'tracks', 'skill', 'zh', 'en', 'ar'];
      requiredFields.forEach(field => {
        if (!anchor[field]) {
          inconsistencies++;
          this.errors.push(`场景锚点 ${anchor.id} 缺少必填字段: ${field}`);
        }
      });

      // 检查轨道数组
      if (anchor.tracks && !Array.isArray(anchor.tracks)) {
        inconsistencies++;
        this.errors.push(`场景锚点 ${anchor.id} tracks 字段必须是数组`);
      }
    });

    this.stats.consistencyCheck = '完成';
    this.stats.inconsistencies = inconsistencies;

    console.log('  ✅ 数据结构检查完成');
  }
}

/**
 * 主函数
 */
async function main() {
  const validator = new QuickPlacementValidator();
  const result = await validator.validate();

  if (!result.success) {
    console.log('\n❌ 预提交校验失败，请修复上述错误后重新提交');
    process.exit(1);
  }

  console.log('\n🎉 预提交校验通过，可以安全提交！');
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 校验脚本执行失败:', error);
    process.exit(1);
  });
}

export { QuickPlacementValidator, ValidationResult };
#!/usr/bin/env tsx

/**
 * QuickPlacement 配置验证脚本
 * 验证环境配置、功能开关、回滚机制
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

interface ConfigStatus {
  shadowMode: boolean;
  v1_1Enabled: boolean;
  apiValidation: boolean;
  precommitHooks: boolean;
  contractTests: boolean;
  e2eTests: boolean;
}

interface ConfigIssue {
  type: 'error' | 'warning';
  category: string;
  description: string;
  current: string;
  expected: string;
  fixCommand?: string;
}

class QuickPlacementConfigVerifier {
  private issues: ConfigIssue[] = [];
  private config: ConfigStatus = {
    shadowMode: false,
    v1_1Enabled: false,
    apiValidation: false,
    precommitHooks: false,
    contractTests: false,
    e2eTests: false
  };

  constructor() {
    console.log('🔧 QuickPlacement 配置验证工具启动...\n');
  }

  /**
   * 执行所有配置验证
   */
  async verify(): Promise<void> {
    try {
      // 1. 检查环境配置
      await this.checkEnvironmentConfig();

      // 2. 检查功能开关
      await this.checkFeatureFlags();

      // 3. 检查代码结构
      await this.checkCodeStructure();

      // 4. 检查测试配置
      await this.checkTestConfiguration();

      // 5. 检查回滚机制
      await this.checkRollbackMechanism();

      // 6. 生成配置报告
      await this.generateConfigReport();

      console.log('\n🎉 配置验证完成！');
    } catch (error) {
      console.error('❌ 配置验证失败:', error);
      process.exit(1);
    }
  }

  /**
   * 检查环境配置
   */
  private async checkEnvironmentConfig(): Promise<void> {
    console.log('🔍 检查环境配置...');

    // 检查 .env.local 文件
    const envPath = path.join(projectRoot, '.env.local');
    if (!fs.existsSync(envPath)) {
      this.issues.push({
        type: 'warning',
        category: '环境配置',
        description: '.env.local 文件不存在',
        current: '未找到',
        expected: '.env.local 文件存在',
        fixCommand: '创建 .env.local 文件'
      });
    } else {
      const envContent = fs.readFileSync(envPath, 'utf-8');

      // 检查影子模式配置
      const shadowModeEnabled = envContent.includes('QP_SHADOW=true');
      this.config.shadowMode = shadowModeEnabled;

      if (shadowModeEnabled) {
        console.log('  ✅ 影子模式已启用 (QP_SHADOW=true)');
      } else {
        this.issues.push({
          type: 'warning',
          category: '环境配置',
          description: '影子模式未启用',
          current: 'QP_SHADOW 未设置或为 false',
          expected: 'QP_SHADOW=true',
          fixCommand: '在 .env.local 中添加 QP_SHADOW=true'
        });
      }

      // 检查 v1.1 功能开关
      const v1_1Enabled = envContent.includes('FEATURE_QP_V1_1=true');
      this.config.v1_1Enabled = v1_1Enabled;

      if (!v1_1Enabled) {
        console.log('  ✅ v1.1 功能已安全关闭 (FEATURE_QP_V1_1=false)');
      } else {
        this.issues.push({
          type: 'warning',
          category: '环境配置',
          description: 'v1.1 功能已启用，请确认准备就绪',
          current: 'FEATURE_QP_V1_1=true',
          expected: 'FEATURE_QP_V1_1=false (安全模式)',
          fixCommand: '在 .env.local 中设置 FEATURE_QP_V1_1=false'
        });
      }
    }

    console.log('✅ 环境配置检查完成');
  }

  /**
   * 检查功能开关
   */
  private async checkFeatureFlags(): Promise<void> {
    console.log('🔍 检查功能开关...');

    // 检查 API 验证代码
    const questionsRoutePath = path.join(projectRoot, 'src/app/api/placement/questions/route.ts');
    if (fs.existsSync(questionsRoutePath)) {
      const content = fs.readFileSync(questionsRoutePath, 'utf-8');
      const hasValidation = content.includes('防泄题过滤') || content.includes('sanitizedQuestions');
      this.config.apiValidation = hasValidation;

      if (hasValidation) {
        console.log('  ✅ API 验证已实现');
      } else {
        this.issues.push({
          type: 'error',
          category: '功能开关',
          description: 'API 防泄题验证未实现',
          current: '未找到验证代码',
          expected: '实现防泄题过滤',
          fixCommand: '在 questions/route.ts 中添加数据过滤逻辑'
        });
      }
    }

    console.log('✅ 功能开关检查完成');
  }

  /**
   * 检查代码结构
   */
  private async checkCodeStructure(): Promise<void> {
    console.log('🔍 检查代码结构...');

    // 检查必要的文件
    const requiredFiles = [
      'src/server/services/placement/qb_schema.ts',
      'src/server/services/placement/qb_bank.ts',
      'src/app/api/placement/questions/route.ts',
      'src/app/api/placement/evaluate/route.ts'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} 存在`);
      } else {
        this.issues.push({
          type: 'error',
          category: '代码结构',
          description: `必要文件缺失: ${file}`,
          current: '文件不存在',
          expected: `${file} 存在`,
          fixCommand: `创建 ${file} 文件`
        });
      }
    });

    console.log('✅ 代码结构检查完成');
  }

  /**
   * 检查测试配置
   */
  private async checkTestConfiguration(): Promise<void> {
    console.log('🔍 检查测试配置...');

    // 检查合同测试
    const contractTestPath = path.join(projectRoot, 'src/server/services/placement/__tests__/qb_contract.spec.ts');
    if (fs.existsSync(contractTestPath)) {
      this.config.contractTests = true;
      console.log('  ✅ 合同测试已配置');
    } else {
      this.issues.push({
        type: 'warning',
        category: '测试配置',
        description: '合同测试未配置',
        current: 'qb_contract.spec.ts 不存在',
        expected: 'qb_contract.spec.ts 存在',
        fixCommand: '创建合同测试文件'
      });
    }

    // 检查 E2E 测试
    const e2eTestPath = path.join(projectRoot, 'tests/e2e/qp-batch.spec.ts');
    if (fs.existsSync(e2eTestPath)) {
      this.config.e2eTests = true;
      console.log('  ✅ E2E 测试已配置');
    } else {
      this.issues.push({
        type: 'warning',
        category: '测试配置',
        description: 'E2E 测试未配置',
        current: 'qp-batch.spec.ts 不存在',
        expected: 'qp-batch.spec.ts 存在',
        fixCommand: '创建 E2E 测试文件'
      });
    }

    console.log('✅ 测试配置检查完成');
  }

  /**
   * 检查回滚机制
   */
  private async checkRollbackMechanism(): Promise<void> {
    console.log('🔍 检查回滚机制...');

    // 检查预提交钩子
    const precommitPath = path.join(projectRoot, '.husky/pre-commit');
    if (fs.existsSync(precommitPath)) {
      this.config.precommitHooks = true;
      const content = fs.readFileSync(precommitPath, 'utf-8');

      if (content.includes('validate-qb.ts')) {
        console.log('  ✅ 预提交钩子已配置题库验证');
      } else {
        this.issues.push({
          type: 'warning',
          category: '回滚机制',
          description: '预提交钩子未包含题库验证',
          current: '未包含 validate-qb.ts',
          expected: '包含题库验证',
          fixCommand: '在 pre-commit 中添加 npm run validate:qb'
        });
      }
    } else {
      this.issues.push({
        type: 'warning',
        category: '回滚机制',
        description: '预提交钩子未配置',
        current: 'pre-commit 不存在',
        expected: 'pre-commit 存在',
        fixCommand: '运行 npm run prepare 配置 husky'
      });
    }

    // 检查 package.json 脚本
    const packagePath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const scripts = packageContent.scripts || {};

      const requiredScripts = [
        { name: 'test:contract', description: '合同测试' },
        { name: 'validate:qb', description: '题库验证' },
        { name: 'fix:qb', description: '题库修复' }
      ];

      requiredScripts.forEach(script => {
        if (scripts[script.name]) {
          console.log(`  ✅ ${script.description}脚本已配置`);
        } else {
          this.issues.push({
            type: 'warning',
            category: '回滚机制',
            description: `${script.description}脚本未配置`,
            current: `${script.name} 不存在`,
            expected: `${script.name} 存在`,
            fixCommand: `在 package.json 中添加 ${script.name} 脚本`
          });
        }
      });
    }

    console.log('✅ 回滚机制检查完成');
  }

  /**
   * 生成配置报告
   */
  private async generateConfigReport(): Promise<void> {
    const reportPath = path.join(projectRoot, 'docs/QP_CONFIG_REPORT.md');

    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;

    const report = `# QuickPlacement 配置验证报告

## 验证时间
${new Date().toLocaleString('zh-CN')}

## 配置状态

| 配置项 | 状态 |
|--------|------|
| 影子模式 (QP_SHADOW) | ${this.config.shadowMode ? '✅ 已启用' : '❌ 未启用'} |
| v1.1 功能 (FEATURE_QP_V1_1) | ${this.config.v1_1Enabled ? '⚠️ 已启用' : '✅ 安全关闭'} |
| API 验证 | ${this.config.apiValidation ? '✅ 已实现' : '❌ 未实现'} |
| 预提交钩子 | ${this.config.precommitHooks ? '✅ 已配置' : '❌ 未配置'} |
| 合同测试 | ${this.config.contractTests ? '✅ 已配置' : '❌ 未配置'} |
| E2E 测试 | ${this.config.e2eTests ? '✅ 已配置' : '❌ 未配置'} |

## 问题统计
- 错误数量: ${errorCount}
- 警告数量: ${warningCount}
- 总问题数: ${this.issues.length}

## 问题详情

${this.issues.map((issue, index) => `
### ${index + 1}. ${issue.description}

- **类型**: ${issue.type === 'error' ? '❌ 错误' : '⚠️ 警告'}
- **类别**: ${issue.category}
- **当前状态**: ${issue.current}
- **期望状态**: ${issue.expected}
${issue.fixCommand ? `- **修复命令**: \`${issue.fixCommand}\`` : ''}

`).join('')}

## 推荐操作

### 安全模式配置 (推荐)
\`\`\`bash
# 1. 确保影子模式启用
echo "QP_SHADOW=true" >> .env.local

# 2. 确保 v1.1 功能关闭
echo "FEATURE_QP_V1_1=false" >> .env.local

# 3. 运行完整验证
npm run validate:qb
npm run test:contract
\`\`\`

### 生产环境部署准备
\`\`\`bash
# 1. 启用 v1.1 功能
echo "FEATURE_QP_V1_1=true" >> .env.local

# 2. 运行完整测试
npm run test:e2e
npm run test:contract

# 3. 验证 API 响应
curl http://localhost:3000/api/placement/questions?locale=zh
\`\`\`

## 回滚策略

### 如果出现问题
1. **立即回滚**: 在 .env.local 中设置 \`FEATURE_QP_V1_1=false\`
2. **保持影子模式**: 确保 \`QP_SHADOW=true\` 以便调试
3. **检查日志**: 查看 docs/ 目录下的验证报告
4. **运行修复**: 使用 \`npm run fix:qb\` 修复数据问题

### 完全回滚到 v1.0
\`\`\`bash
# 1. 禁用所有 v1.1 功能
echo "FEATURE_QP_V1_1=false" >> .env.local
echo "QP_SHADOW=false" >> .env.local

# 2. 恢复原始 API (如果需要)
git checkout HEAD~1 -- src/app/api/placement/

# 3. 重启服务
npm run dev
\`\`\`

---

*此报告由配置验证脚本自动生成*
`;

    // 确保目录存在
    const docsDir = path.dirname(reportPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`📄 配置报告已生成: ${reportPath}`);

    // 输出摘要
    console.log('\n📊 配置摘要:');
    console.log(`  - 错误: ${errorCount}`);
    console.log(`  - 警告: ${warningCount}`);
    console.log(`  - 影子模式: ${this.config.shadowMode ? '✅' : '❌'}`);
    console.log(`  - v1.1 功能: ${this.config.v1_1Enabled ? '⚠️' : '✅'}`);

    if (errorCount > 0) {
      console.log('\n❌ 请修复以上错误后重新运行验证');
    } else if (warningCount > 0) {
      console.log('\n⚠️ 建议处理以上警告以获得最佳配置');
    } else {
      console.log('\n🎉 配置验证通过，系统状态良好！');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const verifier = new QuickPlacementConfigVerifier();
  await verifier.verify();
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 配置验证脚本执行失败:', error);
    process.exit(1);
  });
}

export { QuickPlacementConfigVerifier, ConfigStatus, ConfigIssue };
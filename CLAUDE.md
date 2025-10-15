# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个AI定制学习方案的Landing Page项目，面向学员提供从信息采集到学习方案生成的完整闭环体验。项目使用Next.js 14 + React 18 + TypeScript构建，集成DeepSeek API实现AI驱动的学习规划。

## 技术栈

- **前端框架**: Next.js 14, React 18
- **语言**: TypeScript
- **样式**: TailwindCSS
- **状态管理**: Zustand (或 Redux Toolkit)
- **数据校验**: Zod
- **数据获取**: SWR/React Query
- **国际化**: i18n (支持中文/英语/阿拉伯语)
- **AI集成**: DeepSeek API (通过LLMAdapter抽象层)
- **部署**: Vercel (可选)

## 核心架构

### 用户旅程流程
1. 进入页 - 语言选择和文化模式
2. 信息采集 - 对话式表单收集学习需求
3. 方案生成 - AI生成三档学习方案(轻/标/进)
4. 方案选择 - 用户选择适合的学习强度
5. 月度计划 - 展示16周学习里程碑
6. 课程大纲 - 首月详细课程安排
7. 导出提醒 - 下载方案、设置提醒

### 关键约束
- **CEFR限制**: 前台禁止出现A1/A2/B1等CEFR术语
- **难度控制**: 首月不超过A2+，第二月仅≤10%词块级B1-预热
- **文化合规**: 阿语地区默认sa模式，中性办公场景
- **移动优先**: 响应式设计，RTL支持

## 目录结构

```
/app
  /page.tsx                 // 进入页
  /wizard/page.tsx          // 采集信息
  /plans/page.tsx           // 三卡展示
  /plan/[tier]/page.tsx     // 选档确认 + 月度计划
  /plan/[tier]/month1/page.tsx // 首月大纲
  /export/page.tsx          // 导出/提醒
/components
  IntakeWizard.tsx          // 信息采集向导
  PlanCards.tsx             // 三档方案卡片
  MilestonesView.tsx        // 月度里程碑
  MonthOneSyllabus.tsx      // 首月课程大纲
  QuickTest.tsx             // 快速测试
/lib
  /llm
    adapter.ts              // LLM适配器接口
    deepseek.ts             // DeepSeek实现
  /prompts/*.ts             // AI提示词
  /schema/*.ts              // Zod校验模式
  /calc/time.ts             // 时间计算工具
  /diagnosis/index.ts       // 可达性诊断
/server
  /routes/*                 // API路由
  /services/*               // 业务逻辑服务
```

## 开发命令

由于项目尚未初始化，以下为建议的常用命令：

```bash
# 安装依赖
npm install

# 开发环境
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 格式化
npm run format

# 测试
npm run test

# E2E测试
npm run test:e2e
```

## 环境配置

```bash
# .env.local
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1  # 可选
```

## AI集成说明

### LLMAdapter抽象层
所有AI调用必须通过LLMAdapter接口，确保模型可替换性：

```typescript
export interface LLMAdapter {
  chat<TOut>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<string>;
}
```

### AI调用阶段
1. **三档方案生成**: 基于用户信息生成PlanOption[]
2. **月度计划生成**: 生成16周MonthlyPlan
3. **首月大纲生成**: 生成FirstMonthSyllabus
4. **快测生成**: 生成测试题目和答案
5. **合规修复**: 扫描并修复不合规内容

## 数据模型

核心TypeScript类型定义(使用Zod校验)：

- `Intake`: 用户采集信息
- `PlanOption`: 学习方案选项 (light/standard/intensive)
- `MonthlyPlan`: 16周月度计划
- `Lesson`: 单个课程定义
- `FirstMonthSyllabus`: 首月课程大纲

## 质量保障

- **Schema校验**: 所有AI输出必须通过Zod校验
- **越级守卫**: 严格控制难度不超过规定等级
- **文化合规**: 自动扫描和修复敏感内容
- **防泄题**: 快测题目纯文本展示，答案键分离
- **加载状态**: 骨架屏和错误处理

## 国际化

支持三语言：中文(ZH)、英语(EN)、阿拉伯语(AR)
- 阿拉伯语需要RTL布局支持
- 文化模式：sa(沙特)、gcc(海湾)、none

## 埋点事件

匿名事件追踪：intake_completed、plan_shown、plan_selected、monthly_plan_rendered、export_clicked等

## 验收标准

- 前台完全不暴露CEFR术语
- 严格的16周难度递进控制
- 三档方案均显示完成时间和可达性诊断
- DeepSeek API通过适配器集成
- 支持阿拉伯语RTL和移动端
- 导出Excel/PDF功能正常
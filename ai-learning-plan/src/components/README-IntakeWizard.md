# IntakeWizard 组件使用说明

## 概述

IntakeWizard 是一个完整的信息采集向导组件，通过6个步骤收集用户的英语学习相关信息，帮助制定个性化的学习方案。

## 功能特性

### 🎯 核心功能
- **6步骤表单采集**：性别、身份、母语、学习目标、时间安排、基础评估
- **实时表单验证**：必填字段验证、输入长度限制、数值范围验证
- **自动数据保存**：用户输入时自动保存草稿
- **步骤进度指示**：可视化显示当前进度和完成状态

### 🎨 用户体验
- **平滑动画过渡**：步骤切换时的流畅动画效果
- **键盘导航支持**：支持方向键和快捷键操作
- **响应式设计**：适配各种屏幕尺寸
- **无障碍访问**：符合WCAG标准，支持屏幕阅读器

### 🛠 技术特性
- **TypeScript严格类型**：完整的类型定义和类型安全
- **深色模式支持**：自动适配系统主题
- **RTL布局支持**：支持从右到左的语言布局
- **现代化UI设计**：使用Tailwind CSS构建

## 文件结构

```
src/components/
├── IntakeWizard.tsx              # 主组件
├── IntakeWizardExample.tsx       # 使用示例
├── wizard/                       # 子组件目录
│   ├── StepIndicator.tsx         # 步骤指示器
│   ├── GenderStep.tsx            # 性别选择步骤
│   ├── IdentityStep.tsx          # 身份选择步骤
│   ├── NativeLanguageStep.tsx    # 母语选择步骤
│   ├── GoalStep.tsx              # 学习目标步骤
│   ├── ScheduleStep.tsx          # 时间安排步骤
│   └── FoundationStep.tsx        # 基础评估步骤
├── types/
│   └── intake.ts                 # 类型定义
├── utils/
│   └── validation.ts             # 验证工具
└── constants/
    └── intake.ts                 # 常量配置
```

## 基本使用

### 1. 导入组件

```typescript
import { IntakeWizard } from '@/components/IntakeWizard';
import { IntakeFormData } from '@/types/intake';
```

### 2. 基本使用

```typescript
export default function MyPage() {
  const handleComplete = async (data: IntakeFormData) => {
    console.log('采集完成:', data);
    // 处理完成逻辑，如跳转到学习计划页面
  };

  const handleSave = async (data: Partial<IntakeFormData>) => {
    console.log('自动保存:', data);
    // 保存草稿到服务器
  };

  return (
    <IntakeWizard
      onComplete={handleComplete}
      onSave={handleSave}
      className="py-8"
    />
  );
}
```

### 3. 带初始数据的使用

```typescript
const initialData: Partial<IntakeFormData> = {
  gender: 'male',
  identity: 'professional',
  schedule: {
    dailyHours: 2,
    weeklyDays: 5,
  }
};

<IntakeWizard
  onComplete={handleComplete}
  onSave={handleSave}
  initialData={initialData}
/>
```

## API 参考

### IntakeWizard Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| onComplete | (data: IntakeFormData) => Promise\<void\> | 是 | - | 完成采集时的回调函数 |
| onSave | (data: Partial\<IntakeFormData\>) => Promise\<void\> | 否 | - | 自动保存时的回调函数 |
| initialData | Partial\<IntakeFormData\> | 否 | {} | 初始化表单数据 |
| className | string | 否 | '' | 自定义CSS类名 |

### IntakeFormData 类型

```typescript
interface IntakeFormData {
  gender: 'male' | 'female' | 'other';
  identity: 'professional' | 'university' | 'highschool';
  nativeLanguage: string;
  learningGoal: string;
  schedule: {
    dailyHours: number;
    weeklyDays: number;
  };
  isBeginner: boolean;
  wantsQuickTest: boolean;
}
```

## 步骤详细说明

### 步骤 1：性别选择
- 可选：男性、女性、其他
- 必填项
- 选择后自动进入下一步

### 步骤 2：身份选择
- 可选：职场人士、大学生、高中生
- 必填项
- 根据身份制定不同的学习策略

### 步骤 3：母语选择
- 支持20+种常用语言
- 支持搜索功能
- 必填项

### 步骤 4：学习目标
- 文本输入，10-500字符
- 提供常用目标参考
- 支持Ctrl+Enter快速提交

### 步骤 5：时间安排
- 每日学习时长：0.5-12小时
- 每周学习天数：1-7天
- 提供快捷选项和自定义输入

### 步骤 6：基础评估
- 零基础/有基础选择
- 可选快速水平测试
- 完成后显示信息摘要

## 验证规则

### 字段验证
- **性别**：必填
- **身份**：必填
- **母语**：必填
- **学习目标**：必填，10-500字符
- **时间安排**：必填，每日0.5-12小时，每周1-7天
- **基础评估**：必填

### 实时验证
- 每个步骤切换时进行验证
- 显示具体的错误信息
- 阻止无效数据提交

## 键盘快捷键

- **Ctrl/Cmd + ←**：上一步
- **Ctrl/Cmd + →**：下一步
- **Ctrl/Cmd + Enter**：在目标步骤提交
- **Esc**：关闭下拉菜单
- **Tab/Shift+Tab**：在表单元素间导航

## 样式自定义

### 使用Tailwind CSS类名

```typescript
<IntakeWizard className="custom-container" />
```

### 主题定制

组件使用Tailwind CSS的颜色系统，可以通过修改配置文件来自定义主题：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          600: '#2563eb',
          // ...
        }
      }
    }
  }
}
```

## 响应式断点

- **移动端**：< 640px - 单列布局
- **平板端**：640px - 1024px - 适配调整
- **桌面端**：> 1024px - 完整布局

## 无障碍访问

- 完整的ARIA标签支持
- 键盘导航友好
- 高对比度支持
- 屏幕阅读器优化

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 性能优化

- React.memo 优化重渲染
- 懒加载非关键组件
- 防抖自动保存
- 虚拟化长列表（语言选择）

## 示例集成

### Next.js 页面集成

```typescript
// pages/intake.tsx
import { IntakeWizardExample } from '@/components/IntakeWizardExample';

export default function IntakePage() {
  return <IntakeWizardExample />;
}
```

### 数据持久化

```typescript
// 使用localStorage保存草稿
const handleSave = async (data: Partial<IntakeFormData>) => {
  localStorage.setItem('intake-draft', JSON.stringify(data));

  // 同时保存到服务器
  await fetch('/api/intake/draft', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
```

## 常见问题

### Q: 如何自定义步骤顺序？
A: 修改 `constants/intake.ts` 中的 `STEPS` 数组顺序。

### Q: 如何添加新的表单字段？
A: 需要修改类型定义、验证逻辑、对应的步骤组件和常量配置。

### Q: 如何集成后端API？
A: 在 `onComplete` 和 `onSave` 回调中调用相应的API接口。

### Q: 支持国际化吗？
A: 组件当前使用中文，但所有文本都提取在常量文件中，易于国际化。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持6步骤信息采集
- 完整的表单验证
- 响应式设计
- 无障碍访问支持
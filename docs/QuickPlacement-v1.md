# QuickPlacement v1 技术文档

## 概述

QuickPlacement v1 是一个3分钟可选快测系统，用于快速评估学员的英语水平。系统支持三语种（中文/英语/阿拉伯语），包含场景锚定题目、客观题评分和自评融合功能。

## 系统架构

### 核心组件

1. **题库系统** (`qb_bank.ts`)
   - 10道客观题，覆盖4个场景：日常/职场/旅行/学术
   - 支持3种语言的本地化
   - CEFR等级映射和难度分配

2. **评估引擎** (`quick_placement.ts`)
   - 客观题评分算法
   - 自评融合算法（70%客观题 + 30%自评）
   - 置信度计算
   - 影子模式支持

3. **API路由**
   - `/api/placement/questions` - 获取题库
   - `/api/placement/evaluate` - 提交评估

4. **前端组件**
   - `QuickPlacement` - 主组件
   - `QuickPlacementIntro` - 介绍页
   - `QuickPlacementQuestions` - 题目展示
   - `QuickPlacementSelfAssessment` - 自评页面
   - `QuickPlacementResults` - 结果展示
   - `QuickPlacementProgress` - 进度条

## 评估算法

### 客观题评分

根据答对题数映射CEFR等级：

| 答对题数 | CEFR等级 | 说明 |
|---------|----------|------|
| 9-10题  | B2       | 高级水平 |
| 7-8题   | B1       | 中级水平 |
| 4-6题   | A2       | 日常交流 |
| 0-3题   | A1       | 基础水平 |

### 融合算法

当用户提供自评时，采用加权融合：

```
最终等级 = 客观题等级 × 0.7 + 自评等级 × 0.3
```

其中CEFR等级转换为数值：A1=0, A2=1, B1=2, B2=3

### 置信度计算

- 基础置信度 = 客观题准确率
- 如果自评与客观题等级差距≤1级，置信度+0.1
- 如果自评与客观题等级差距≥3级，置信度-0.2

## API接口

### 获取题库

**GET** `/api/placement/questions?locale=zh`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "locale": "zh",
    "config": {
      "time_limit_seconds": 180,
      "question_count": 10
    },
    "stats": {
      "total_questions": 10,
      "by_scene": {...},
      "by_skill": {...}
    }
  }
}
```

### 提交评估

**POST** `/api/placement/evaluate`

**请求体：**
```json
{
  "locale": "zh",
  "user_answers": [0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
  "self_assessment": {
    "listening": "A2",
    "reading": "A2",
    "speaking": "A2",
    "writing": "A2",
    "overall": "A2"
  },
  "track_hint": "daily"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "mapped_start": "A2",
    "confidence": 0.8,
    "breakdown": {
      "objective_score": {
        "correct": 6,
        "total": 10,
        "accuracy": 0.6
      },
      "self_assessment": "A2",
      "fusion_weights": {
        "objective": 0.7,
        "self_assessment": 0.3
      }
    },
    "diagnostic": {
      "stronger_skills": ["Listening"],
      "weaker_skills": ["Reading"],
      "recommended_focus": ["日常交流", "基础语法"]
    },
    "metadata": {
      "question_count": 10,
      "locale": "zh",
      "version": "v1"
    }
  }
}
```

## 配置选项

### 环境变量

```bash
# 功能开关
FEATURE_QUICK_PLACEMENT=true                # 快测功能总开关
FEATURE_PLACEMENT_SHADOW_MODE=false         # 影子模式
FEATURE_PLACEMENT_FUSION=true               # 自评融合功能

# 权重配置
PLACEMENT_OBJECTIVE_WEIGHT=0.7              # 客观题权重
PLACEMENT_SELF_WEIGHT=0.3                   # 自评权重

# 基础配置
PLACEMENT_TIME_LIMIT_SECONDS=180            # 时间限制
PLACEMENT_QUESTION_COUNT=10                 # 题目数量
```

### 运行时配置

```typescript
const config: Partial<QuickPlacementConfig> = {
  enable_fusion: true,                      // 启用融合算法
  fusion_objective_weight: 0.7,             // 客观题权重
  fusion_self_weight: 0.3,                  // 自评权重
  question_count: 10,                       // 题目数量
  time_limit_seconds: 180                   // 时间限制
};
```

## 前端集成

### 基础使用

```tsx
import { QuickPlacement } from '@/components/QuickPlacement';

function MyComponent() {
  const handleComplete = (result) => {
    console.log('评估结果:', result);
  };

  const handleSkip = () => {
    console.log('用户跳过快测');
  };

  return (
    <QuickPlacement
      locale="zh"
      trackHint="daily"
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
```

### 高级配置

```tsx
<QuickPlacement
  locale="zh"
  trackHint="work"
  onComplete={(result) => {
    // 处理评估结果
    localStorage.setItem('placement_result', JSON.stringify(result));
  }}
  onSkip={() => {
    // 处理跳过逻辑
    router.push('/intake');
  }}
  className="custom-styles"
/>
```

## 影子模式

影子模式允许并行运行新旧算法，用于A/B测试：

```typescript
import { shadowModeEvaluation } from '@/server/services/placement/quick_placement';

const shadowResult = await shadowModeEvaluation(request, legacyAdapter);

console.log('新算法结果:', shadowResult.new_result);
console.log('旧算法结果:', shadowResult.legacy_result);
console.log('比较结果:', shadowResult.comparison);
```

## 国际化

系统支持三种语言：

### 中文 (zh)
- 简体中文界面
- 题目中文翻译
- 文化适应性调整

### 英语 (en)
- 英文界面
- 原始英文题目
- 国际通用设计

### 阿拉伯语 (ar)
- 阿拉伯语界面
- RTL布局支持
- 文化合规设计

## 测试

### 单元测试

```bash
# 运行QuickPlacement测试
npm test -- QuickPlacement

# 运行所有测试
npm test
```

### 测试覆盖

- ✅ 客观题评分算法
- ✅ 融合算法逻辑
- ✅ 置信度计算
- ✅ 答案验证
- ✅ 题库本地化
- ✅ 边界情况处理

### 手动测试

访问测试页面：
```
http://localhost:3000/quick-placement
```

## 部署

### Vercel部署

1. 设置环境变量
2. 启用功能开关：
   ```bash
   FEATURE_QUICK_PLACEMENT=true
   ```
3. 部署验证API接口

### 本地开发

1. 复制环境变量：
   ```bash
   cp .env.example .env.local
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 访问测试页面进行验证

## 性能优化

### 前端优化
- 组件懒加载
- 图片优化
- 状态管理优化

### 后端优化
- API响应缓存
- 题库预加载
- 数据库查询优化

### 监控指标
- API响应时间
- 错误率
- 用户完成率
- 平均用时

## 故障排除

### 常见问题

**Q: API返回503错误**
A: 检查 `FEATURE_QUICK_PLACEMENT` 环境变量是否设置为 `true`

**Q: 题目显示乱码**
A: 确认语言参数正确，检查字符编码设置

**Q: 评估结果不准确**
A: 检查权重配置，验证CEFR映射逻辑

**Q: 影子模式不工作**
A: 确认 `FEATURE_PLACEMENT_SHADOW_MODE` 启用，检查旧算法适配器

### 调试模式

启用调试输出：
```bash
DEBUG_PLACEMENT=true npm run dev
```

## 版本历史

### v1.0.0 (当前版本)
- ✅ 基础快测功能
- ✅ 三语种支持
- ✅ 自评融合算法
- ✅ 影子模式
- ✅ 完整前端组件

### 计划功能
- 🔄 音频播放支持
- 🔄 更多题目类型
- 🔄 自适应难度
- 🔄 学习路径建议

## 技术栈

- **前端**: React 18, Next.js 14, TypeScript, TailwindCSS
- **后端**: Next.js API Routes, Node.js
- **测试**: Jest, React Testing Library
- **部署**: Vercel
- **AI集成**: Gemini API (可选)

## 联系方式

如有问题或建议，请联系开发团队。

---

*最后更新: 2025年1月*
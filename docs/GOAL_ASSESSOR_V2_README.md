# Goal→CEFR Assessor v2 系统文档

## 概述

Goal→CEFR Assessor v2是一个基于语义分析和CEFR框架的智能目标评估系统，旨在提升"根据学员目标文本判定所需 CEFR 微档"的准确性与可解释性。

## 🎯 核心特性

### 1. 多维度CEFR评估
- **交际功能复杂度**: 问候、描述、论证等
- **话语长度与组织**: 单句、段落、结构化叙述
- **任务步骤复杂度**: 单步到多步任务处理
- **受众与语域**: 非正式到专业场合
- **准确性敏感度**: 大意理解到专业术语
- **文体要求**: 口语体到专业文体

### 2. 智能轨道识别
- work (职场): 权重 1.2
- travel (旅行): 权重 0.8
- study (学术): 权重 1.4
- daily (日常): 权重 0.6
- exam (考试): 权重 1.6

### 3. 微档精准判定
支持A2-、A2、A2+、B1-、B1五个微档等级，提供更精确的目标设定。

### 4. 多语言支持
- 自动语言检测 (中文/英文/阿拉伯语)
- 文本归一化处理
- 跨语言语义理解

### 5. 风险与模糊性标记
- 域风险评估 (low/medium/high)
- 混合意图检测
- 自评差距警告
- 细节不足提醒

## 🚀 快速开始

### 环境变量配置

```bash
# .env.local
# 功能开关
FEATURE_GOAL_ASSESSOR_V2=false          # v2功能总开关 (default=false)
GOAL_ASSESSOR_SHADOW=true               # 影子模式 (default=false)
ASSESSOR_LOGGING_ENABLED=true           # 日志开关 (default=true)

# API配置
GEMINI_API_KEY=your_gemini_api_key      # Gemini API密钥
GEMINI_MODEL=gemini-2.5-pro            # Gemini模型 (default=gemini-2.5-pro)
DEEPSEEK_API_KEY=your_deepseek_api_key  # DeepSeek API密钥 (备用)
```

### 基本使用

```typescript
import { assessGoalCEFR } from '@/server/services/assessor';

const result = await assessGoalCEFR({
  learner_goal_free_text: "职场60-90秒口头更新工作进展，以及6-8句确认邮件",
  self_assessed_level: "A2",
  identity: "working_adult",
  native_language: "zh",
  cultural_mode: "none"
}, {
  shadow: false,  // 是否影子模式
  session_id: "session_123"  // 会话ID
});

console.log(result);
// {
//   targetBand: "B1",
//   track: "work",
//   confidence: 0.82,
//   explanation: "需要结构化口头汇报能力...",
//   v2_data: {
//     ui_target_label: "职场汇报",
//     alternatives: [...],
//     rationale: "...",
//     evidence_phrases: [...],
//     ambiguity_flags: [],
//     domain_risk: "low"
//   }
// }
```

## 🔧 功能模式

### 1. v1模式 (默认)
```bash
FEATURE_GOAL_ASSESSOR_V2=false
GOAL_ASSESSOR_SHADOW=false
```
- 使用现有逻辑
- 无变化，完全向后兼容

### 2. 影子模式
```bash
FEATURE_GOAL_ASSESSOR_V2=false
GOAL_ASSESSOR_SHADOW=true
```
- UI仍使用v1结果
- 后台同步运行v2对比
- 记录差异日志
- 零风险数据收集

### 3. v2模式
```bash
FEATURE_GOAL_ASSESSOR_V2=true
GOAL_ASSESSOR_SHADOW=false
```
- 正式启用v2系统
- 使用新的评估逻辑
- 提供更精准的结果

## 📊 API接口

### 健康检查
```http
GET /api/test-assessor
```

### 评估测试
```http
POST /api/test-assessor
Content-Type: application/json

{
  "intake": {
    "goal_free_text": "学习目标描述",
    "self_assessed_level": "A2",
    "identity": "working_adult",
    "native_language": "zh",
    "cultural_mode": "none"
  },
  "options": {
    "shadow": false,
    "session_id": "test_session"
  }
}
```

## 🧪 测试

### 单元测试
```bash
# 运行CEFR特征测试
npm test -- cefr_features.spec.ts

# 运行v2核心逻辑测试
npm test -- goal_cefr_v2.spec.ts
```

### E2E测试
```bash
# 运行端到端测试
npm run test:e2e goal-assessor.spec.ts
```

### 测试覆盖场景
1. **职场汇报**: B1-级别，多步骤信息组织
2. **旅行交流**: A2+级别，3步内任务执行
3. **学术展示**: B1-级别，观点表达和论证
4. **防误触发**: 混合意图检测，避免过度升级
5. **多语言支持**: 中英文混合输入处理
6. **高风险领域**: 医疗、法律等专业领域标记
7. **自评差距**: 大差距预警机制

## 📈 影子模式日志分析

### 日志格式
```json
{
  "session_id": "session_123",
  "timestamp": "2025-01-15T10:30:00Z",
  "v1_result": {
    "targetBand": "A2",
    "track": "daily",
    "confidence": 0.7
  },
  "v2_result": {
    "target_band_primary": "B1-",
    "confidence_primary": 0.82,
    "track_scores": [...]
  },
  "diff_summary": {
    "band_diff": true,
    "confidence_diff": 0.12,
    "track_diff": true
  },
  "ambiguity_flags": ["mixed_intents"],
  "evidence_count": 3,
  "input_hash": "abc123",
  "input_length": 45
}
```

### 日志查看
```bash
# 查看影子对比日志
grep "ASSESSOR_DIFF" logs/app.log

# 分析差异分布
grep "ASSESSOR_DIFF" logs/app.log | jq '.diff_summary.band_diff' | sort | uniq -c
```

## 🔄 回滚指南

### 紧急回滚
```bash
# 1. 关闭v2功能
FEATURE_GOAL_ASSESSOR_V2=false

# 2. 重启服务
npm run dev

# 3. 验证回滚
curl http://localhost:3000/api/test-assessor
```

### 渐进式回滚
```bash
# 1. 启用影子模式
FEATURE_GOAL_ASSESSOR_V2=false
GOAL_ASSESSOR_SHADOW=true

# 2. 监控差异日志
# 观察v1和v2的差异情况

# 3. 根据数据决定是否完全回滚
```

## 📋 性能指标

### 响应时间目标
- v1模式: <100ms
- 影子模式: <500ms
- v2模式: <2s (包含LLM调用)

### 准确性指标
- 微档判定准确率: >85%
- 轨道识别准确率: >90%
- 置信度校准: <0.1误差

### 稳定性指标
- 系统可用性: >99.9%
- 降级成功率: 100%
- 并发支持: 50 QPS

## 🛠️ 故障排除

### 常见问题

#### 1. LLM调用失败
**症状**: v2评估失败，降级到v1
**解决**:
- 检查API密钥配置
- 验证网络连接
- 查看速率限制

#### 2. 影子模式无日志
**症状**: 控制台无ASSESSOR_DIFF日志
**解决**:
- 确认GOAL_ASSESSOR_SHADOW=true
- 检查日志级别配置
- 验证影子模式是否正确触发

#### 3. v2结果异常
**症状**: 返回不合理的目标等级
**解决**:
- 检查输入文本格式
- 验证提示词模板
- 查看LLM响应原始内容

### 调试工具

#### 健康检查
```bash
curl http://localhost:3000/api/test-assessor
```

#### 功能状态检查
```bash
# 检查环境变量
echo $FEATURE_GOAL_ASSESSOR_V2
echo $GOAL_ASSESSOR_SHADOW

# 检查API可用性
curl -X POST http://localhost:3000/api/test-assessor \
  -H "Content-Type: application/json" \
  -d '{"intake":{"goal_free_text":"test"}}'
```

## 📚 开发指南

### 添加新的CEFR维度
1. 更新 `CEFR_DIMENSIONS` 常量
2. 调整权重分配 (确保总和为1.0)
3. 更新提示词模板
4. 添加相应的测试用例

### 扩展学习轨道
1. 在 `TRACKS` 中添加新轨道
2. 设置合适的权重
3. 更新轨道映射逻辑
4. 添加测试场景

### 调整LLM提示词
1. 修改 `ASSESSMENT_PROMPT_TEMPLATE`
2. 更新 `FEW_SHOT_EXAMPLES`
3. 测试不同场景的响应
4. 验证JSON输出格式

## 🔒 安全考虑

### 数据隐私
- 输入文本哈希化处理
- 不记录敏感原始内容
- 会话级别数据隔离

### API安全
- 密钥环境变量存储
- 速率限制保护
- 降级机制保障

### 模型安全
- 输出内容验证
- 恶意输入过滤
- 结果合理性检查

## 📞 支持

### 技术支持
- 查看文档和FAQ
- 检查GitHub Issues
- 联系开发团队

### 更新日志
- v2.0.0: 初始版本发布
- v2.1.0: 添加多语言支持
- v2.2.0: 优化准确性和性能

---

**注意**: 本系统设计为渐进式升级，确保在任何时候都可以安全回滚到v1模式，保证生产环境稳定性。
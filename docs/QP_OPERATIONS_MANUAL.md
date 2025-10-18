# QuickPlacement v1.1 运维手册

## 🚨 快速故障处理

### 立即回滚（紧急情况）
```bash
# 1. 禁用 v1.1 功能
echo "FEATURE_QP_V1_1=false" >> .env.local

# 2. 保持影子模式便于调试
echo "QP_SHADOW=true" >> .env.local

# 3. 重启服务
npm run dev
# 生产环境: npm start
```

### 常见问题诊断

#### API 返回答案泄露
```bash
# 1. 检查 API 验证是否生效
curl http://localhost:3000/api/placement/questions?locale=zh | grep -E "(correct|scored|answer)"

# 2. 检查配置
npm run verify:config

# 3. 运行防泄题检查
npm run test:contract -- --testNamePattern="防泄题"
```

#### 题库数据错误
```bash
# 1. 验证题库数据
npm run validate:qb

# 2. 安全检查（只报告不修改）
npm run fix:qb:safe

# 3. 自动修复（谨慎使用）
npm run fix:qb
```

#### 构建失败
```bash
# 1. 类型检查
npm run type-check

# 2. 代码检查
npm run lint

# 3. 运行预提交检查
npx tsx scripts/validate-qb.ts
```

---

## 🔧 日常维护

### 每日检查清单
- [ ] 检查 API 响应是否包含敏感信息
- [ ] 验证影子模式日志
- [ ] 检查错误日志
- [ ] 确认配置状态

### 每周维护任务
```bash
# 1. 运行完整测试套件
npm run test:contract
npm run test:e2e

# 2. 验证配置
npm run verify:config

# 3. 检查题库数据
npm run validate:qb

# 4. 更新文档（如有变更）
```

---

## 📊 监控指标

### 关键指标
- **API 响应时间**: < 5秒
- **错误率**: < 1%
- **防泄题检查**: 100% 通过
- **数据验证**: 100% 通过

### 监控命令
```bash
# API 健康检查
curl -f http://localhost:3000/api/placement/evaluate

# 防泄题检查
curl -s http://localhost:3000/api/placement/questions?locale=zh | jq '.' | grep -E "(correct|scored|answer)" && echo "❌ 发现泄露" || echo "✅ 无泄露"

# 配置验证
npm run verify:config > /tmp/qp-config-$(date +%Y%m%d).log
```

---

## 🔄 版本管理

### 安全发布流程
1. **影子模式验证**
   ```bash
   echo "QP_SHADOW=true" >> .env.local
   echo "FEATURE_QP_V1_1=false" >> .env.local
   npm run test:e2e
   ```

2. **灰度启用**
   ```bash
   echo "FEATURE_QP_V1_1=true" >> .env.local
   npm run verify:config
   ```

3. **全量发布**
   ```bash
   npm run build
   npm start
   ```

### 版本回退
```bash
# 回滚到上一个版本
git checkout HEAD~1

# 或者仅功能回退
echo "FEATURE_QP_V1_1=false" >> .env.local
```

---

## 📁 重要文件

### 配置文件
- `.env.local` - 环境配置
- `.husky/pre-commit` - 预提交钩子
- `package.json` - 项目配置

### 核心代码
- `src/server/services/placement/qb_schema.ts` - 数据验证
- `src/server/services/placement/qb_bank.ts` - 题库数据
- `src/app/api/placement/questions/route.ts` - API 接口

### 工具脚本
- `scripts/validate-qb.ts` - 题库验证
- `scripts/fix-qb.ts` - 数据修复
- `scripts/verify-config.ts` - 配置验证

### 文档报告
- `docs/QP_CONFIG_REPORT.md` - 配置报告
- `docs/QP_SAFE_CHECK_REPORT.md` - 安全检查报告
- `docs/QP_CONTRACT_FIX_DELIVERABLES.md` - 交付物文档

---

## 🚀 性能优化

### API 优化
- 缓存验证结果
- 异步处理大数据
- 限制响应大小

### 数据库优化
- 索引优化
- 查询缓存
- 分页处理

---

## 📞 故障联系

### 内部支持
1. 查看相关文档
2. 运行诊断脚本
3. 检查日志文件

### 紧急联系
- 技术负责人：[联系方式]
- 运维团队：[联系方式]

---

**最后更新**: ${new Date().toLocaleString('zh-CN')}
**版本**: v1.1
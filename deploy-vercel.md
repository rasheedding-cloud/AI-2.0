# Vercel 重新部署指南

## 问题诊断

由于持续的404错误，需要重新建立Vercel项目连接。

## 重新部署步骤

### 1. 登录Vercel控制台
- 访问 https://vercel.com/dashboard
- 使用GitHub账号登录

### 2. 删除现有项目（如果存在）
- 在项目列表中找到 "AI-2.0" 或相关项目
- 进入项目设置 → 删除项目
- 确认删除

### 3. 重新导入项目
- 点击 "New Project"
- 选择 "Import Git Repository"
- 选择 `rasheedding-cloud/AI-2.0` 仓库
- 点击 "Import"

### 4. 配置项目设置

**构建配置：**
```json
{
  "framework": "nextjs",
  "rootDirectory": ".",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

**环境变量：**
```bash
# AI API配置
GEMINI_API_KEY=AIzaSyB_8AaObs18J1fU2biShZgwBydHYQCWGvU
GEMINI_MODEL=gemini-2.5-pro

# 功能开关
FEATURE_MILESTONES_V2=true
FEATURE_DYNAMIC_GATES=true
FEATURE_DYNAMIC_GATES_UI=true
NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI=true
FEATURE_GOAL_ASSESSOR_V2=true
GOAL_ASSESSOR_SHADOW=false
GATES_SHADOW=false
MILESTONES_SHADOW=false
```

### 5. 部署项目
- 点击 "Deploy" 开始部署
- 等待部署完成（通常2-3分钟）

### 6. 验证部署

**测试URL：**
- 主页面：`https://[project-name].vercel.app/`
- 功能测试页：`https://[project-name].vercel.app/test-features`
- 学习计划页：`https://[project-name].vercel.app/plans`

**预期功能：**
- ✅ 个性化里程碑系统
- ✅ 动态评估门限UI
- ✅ 三层计划一致性
- ✅ 功能开关全部启用

### 7. 故障排除

**如果仍然404：**
1. 检查构建日志是否有错误
2. 确认环境变量是否正确设置
3. 验证GitHub仓库连接状态
4. 检查域名配置

**构建失败处理：**
1. 查看具体错误信息
2. 检查依赖包是否完整
3. 验证TypeScript编译
4. 确认文件路径正确

### 8. 功能验证清单

**基础功能：**
- [ ] 主页正常加载
- [ ] 向导页面正常工作
- [ ] 方案选择页面正常
- [ ] 学习计划页面正常

**优化功能：**
- [ ] 个性化里程碑显示
- [ ] 动态评估门限UI
- [ ] 自测功能正常
- [ ] 多语言支持正常

**测试页面：**
- [ ] `/test-features` 显示功能开关状态
- [ ] 所有功能开关显示"启用"
- [ ] 环境变量正确读取

## 紧急联系方式

如果问题持续存在：
1. 检查Vercel状态页面：https://status.vercel.com/
2. 查看Vercel文档：https://vercel.com/docs
3. 联系Vercel支持

## 当前状态

- ✅ 代码已修复并推送
- ✅ 构建错误已解决
- ✅ 项目结构冲突已消除
- ⏳ 等待重新部署完成
- ⏳ 验证功能正常
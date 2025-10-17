/**
 * 前端特性开关配置
 * 与后端保持一致，但仅控制UI显示逻辑
 */

// 从环境变量读取前端特性开关
export const CLIENT_FEATURE_FLAGS = {
  // 动态门限UI增强功能
  DYNAMIC_GATES_UI: process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI === 'true',
} as const;

/**
 * 检查动态门限UI是否启用
 */
export function isDynamicGatesUIEnabled(): boolean {
  return CLIENT_FEATURE_FLAGS.DYNAMIC_GATES_UI;
}

/**
 * 获取客户端特性开关状态
 */
export function getClientFeatureFlags() {
  return {
    ...CLIENT_FEATURE_FLAGS,
    // 添加客户端特有的特性标记
    hasDynamicGatesUI: CLIENT_FEATURE_FLAGS.DYNAMIC_GATES_UI,
  };
}
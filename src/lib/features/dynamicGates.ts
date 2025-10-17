/**
 * Monthly Assessment Gate V2 特性开关配置
 */

// 环境变量读取
export const FEATURE_FLAGS = {
  // 后端动态门限计算
  FEATURE_DYNAMIC_GATES: process.env.FEATURE_DYNAMIC_GATES === 'true',

  // 影子模式 - 记录但不应用新逻辑
  GATES_SHADOW: process.env.GATES_SHADOW === 'true',

  // 前端UI增强功能
  FEATURE_DYNAMIC_GATES_UI: process.env.FEATURE_DYNAMIC_GATES_UI === 'true',
} as const;

/**
 * 检查动态门限功能是否启用
 */
export function isDynamicGatesEnabled(): boolean {
  return FEATURE_FLAGS.FEATURE_DYNAMIC_GATES;
}

/**
 * 检查影子模式是否启用
 */
export function isShadowModeEnabled(): boolean {
  return FEATURE_FLAGS.GATES_SHADOW;
}

/**
 * 检查动态门限UI是否启用
 */
export function isDynamicGatesUIEnabled(): boolean {
  return FEATURE_FLAGS.FEATURE_DYNAMIC_GATES_UI;
}

/**
 * 获取特性开关状态摘要（用于日志和调试）
 */
export function getFeatureFlagsSummary(): {
  dynamicGates: boolean;
  shadowMode: boolean;
  uiEnabled: boolean;
  mode: 'production' | 'shadow' | 'disabled';
} {
  const { FEATURE_DYNAMIC_GATES, GATES_SHADOW, FEATURE_DYNAMIC_GATES_UI } = FEATURE_FLAGS;

  let mode: 'production' | 'shadow' | 'disabled' = 'disabled';
  if (FEATURE_DYNAMIC_GATES && !GATES_SHADOW) {
    mode = 'production';
  } else if (FEATURE_DYNAMIC_GATES && GATES_SHADOW) {
    mode = 'shadow';
  }

  return {
    dynamicGates: FEATURE_DYNAMIC_GATES,
    shadowMode: GATES_SHADOW,
    uiEnabled: FEATURE_DYNAMIC_GATES_UI,
    mode
  };
}

/**
 * 记录特性开关应用日志
 */
export function logFeatureFlagUsage(
  action: string,
  data: any = {}
): void {
  const summary = getFeatureFlagsSummary();

  console.log(`🚩 [Feature] ${action}:`, {
    timestamp: new Date().toISOString(),
    flags: summary,
    data
  });
}

/**
 * 安全执行动态门限逻辑
 * 在功能未启用时返回降级行为
 */
export function withDynamicGates<T>(
  enabledCallback: () => T,
  fallbackCallback: () => T,
  context?: string
): T {
  const isEnabled = isDynamicGatesEnabled();
  const isShadow = isShadowModeEnabled();

  if (isEnabled && !isShadow) {
    // 生产模式：启用新逻辑
    logFeatureFlagUsage('dynamic_gates_applied', { context });
    return enabledCallback();
  } else if (isEnabled && isShadow) {
    // 影子模式：执行新逻辑但不应用结果，仅记录
    logFeatureFlagUsage('dynamic_gates_shadow', { context });
    const result = enabledCallback();
    // 在影子模式下返回降级结果
    return fallbackCallback();
  } else {
    // 功能未启用：使用降级逻辑
    logFeatureFlagUsage('dynamic_gates_fallback', { context });
    return fallbackCallback();
  }
}
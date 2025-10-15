import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 基础配置
  reactStrictMode: true,

  // 构建优化
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AI Learning Plan',
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境优化
  reactStrictMode: true,
  swcMinify: true,

  // 图片优化
  images: {
    domains: ['localhost'],
  },

  // 构建优化
  eslint: {
    ignoreDuringBuilds: true, // 部署时忽略ESLint错误
  },
  typescript: {
    ignoreBuildErrors: false, // 保持类型检查
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AI Learning Plan',
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 基础配置
  reactStrictMode: true,

  // 构建优化
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AI Learning Plan',
  },

  // 开发环境配置
  experimental: {
    // 禁用可能导致问题的实验性功能
  },

  // 服务器外部包配置
  serverExternalPackages: [],

  // Webpack配置优化 (仅在构建时生效)
  ...(process.env.NODE_ENV === 'production' ? {
    webpack: (config, { isServer }) => {
      // 生产环境优化
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'async',
          minSize: 30000,
          maxSize: 0,
          minChunks: 1,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
          automaticNameDelimiter: '~',
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: -20,
              reuseExistingChunk: true,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/](@babel runtime|classnames|lodash|es-uuid|react-is|react-window|react-hook-form|scheduler|hoist-non-react-statics)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: -15,
              reuseExistingChunk: true,
            },
          },
        },
      };

      return config;
    },
  } : {}),

  };

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
        pathname: '/bailian-files/**',
      },
    ],
  },
  
  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 服务端外部包配置（避免 Turbopack 打包 Node.js 原生模块）
  serverExternalPackages: ['tablestore', 'ali-oss'],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 部署时启用独立输出模式（可选）
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;


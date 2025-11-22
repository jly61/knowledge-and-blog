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
      bodySizeLimit: '10mb', // 支持更大的图片上传（最大 5MB 单文件，但需要更大的 body 限制）
    },
  },
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;


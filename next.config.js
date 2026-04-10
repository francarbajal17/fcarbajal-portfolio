/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Local /public images + future Vercel Blob
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Hero covers are full-viewport — allow large sizes
    deviceSizes: [640, 828, 1080, 1280, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig

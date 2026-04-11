/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    localPatterns: [
      { pathname: '/api/images/**' },
    ],
  },
}

module.exports = nextConfig

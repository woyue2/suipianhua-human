/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's3.bmp.ovh' },
      { protocol: 'https', hostname: 'imgurl.org' },
      { protocol: 'https', hostname: 'www.imgurl.org' },
    ],
  },
  eslint: {
    // ⚠️ Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

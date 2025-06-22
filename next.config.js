// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://newara.dev.sparcs.org/api/:path*", // Django dev 서버 주소
      },
    ];
  },
  images: {
    domains: ['sparcs-newara-dev.s3.amazonaws.com'],
  },
};

module.exports = nextConfig;
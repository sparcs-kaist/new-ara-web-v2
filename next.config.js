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
    domains: ['sparcs-newara-dev.s3.amazonaws.com',
      'sparcs-newara.s3.amazonaws.com',
      'newara.dev.sparcs.org',
      'newara.sparcs.org',
      'newara-front.dev.sparcs.org'], // newara-front.dev는 로컬 개발용
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;
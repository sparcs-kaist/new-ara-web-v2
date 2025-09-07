module.exports = {
    async rewrites() {
        return [{ source: '/api/:path*', destination: 'https://newara.dev.sparcs.org/api/:path*' }];
    },
    images: { unoptimized: true },
};
module.exports = {
    images: {
        domains: [
            'sparcs-newara-dev.s3.amazonaws.com',
            'sparcs-newara.s3.amazonaws.com',
            'newara.dev.sparcs.org',
            'newara.sparcs.org',
            'newara-front.dev.sparcs.org',
        ],
    },
    webpack(config) {
        config.module.rules.push({ test: /\.svg$/, use: ['@svgr/webpack'] });
        return config;
    },
    // dev 는 turbopack 이라 webpack() 을 읽지 않는다. 같은 규칙을 따로 준다.
    turbopack: {
        rules: {
            '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
        },
    },
};

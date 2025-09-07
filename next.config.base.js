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
};

module.exports = {
    images: {
        remotePatterns: [
            'sparcs-newara-dev.s3.amazonaws.com',
            'sparcs-newara.s3.amazonaws.com',
            'newara.dev.sparcs.org',
            'newara.sparcs.org',
            'newara-front.dev.sparcs.org',
        ].map((hostname) => ({ protocol: 'https', hostname })),
    },
    turbopack: {
        rules: {
            '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
        },
    },
};

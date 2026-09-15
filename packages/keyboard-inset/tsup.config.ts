import { defineConfig } from 'tsup';

// Two passes so only the react entry carries the 'use client' directive —
// bundlers strip directives from sources, so it must be re-emitted as a
// banner, and putting it on the core entry would wrongly mark the
// framework-agnostic API as client-only for RSC consumers.
export default defineConfig([
    {
        entry: { index: 'src/index.ts' },
        format: ['esm', 'cjs'],
        dts: true,
        sourcemap: true,
        clean: true,
        treeshake: true,
    },
    {
        entry: { react: 'src/react.ts' },
        format: ['esm', 'cjs'],
        dts: true,
        sourcemap: true,
        // No treeshake here: tsup's rollup treeshake pass drops the banner,
        // and the react entry is tiny anyway.
        external: ['react'],
        banner: { js: "'use client';" },
    },
]);

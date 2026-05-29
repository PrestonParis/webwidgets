import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['apps/web/features/**/*.ts', 'apps/web/lib/**/*.ts'],
            exclude: [
                'features/**/*.tsx',
                'features/**/components/**',
                'features/**/hooks/**',
                '**/*.d.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'apps/web'),
        },
    },
});

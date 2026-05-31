import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // ssh2 (via dockerode → docker-modem) contains native binary assets that
    // Turbopack cannot place in ESM chunks. Resolve these at runtime instead.
    serverExternalPackages: [
        'dockerode',
        'docker-modem',
        'ssh2',
        'cpu-features',
    ],
};

const sentryDisabled = process.env.NEXT_DISABLE_SENTRY === '1';

let config = nextConfig;

if (!sentryDisabled) {
    const { withSentryConfig } = require('@sentry/nextjs');

    config = withSentryConfig(
        {
            ...nextConfig,
            // Explicitly list the experimental feature Sentry injects so the
            // "Experiments" warning does not appear as a surprise.
            experimental: {
                ...nextConfig.experimental,
                clientTraceMetadata: ['baggage', 'sentry-trace'],
            },
        },
        {
            ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
            ...(process.env.SENTRY_PROJECT
                ? { project: process.env.SENTRY_PROJECT }
                : {}),
            silent: true,
            widenClientFileUpload: true,
        },
    );
}

export default config;

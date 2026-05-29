import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
    // Next.js 16 reads tsconfig paths automatically — no turbopack.resolveAlias needed.
    // Explicitly list the experimental feature Sentry injects so the "Experiments" warning
    // does not appear as a surprise in dev output.
    experimental: {
        clientTraceMetadata: ['baggage', 'sentry-trace'],
    },
    // ssh2 (via dockerode → docker-modem) contains native binary assets that
    // Turbopack cannot place in ESM chunks. Resolve these at runtime instead.
    serverExternalPackages: [
        'dockerode',
        'docker-modem',
        'ssh2',
        'cpu-features',
    ],
};

export default withSentryConfig(nextConfig, {
    ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
    ...(process.env.SENTRY_PROJECT
        ? { project: process.env.SENTRY_PROJECT }
        : {}),
    silent: true,
    widenClientFileUpload: true,
});

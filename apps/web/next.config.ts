import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
    // Next.js 16 reads tsconfig paths automatically — no turbopack.resolveAlias needed.
    // Explicitly list the experimental feature Sentry injects so the "Experiments" warning
    // does not appear as a surprise in dev output.
    experimental: {
        clientTraceMetadata: ['baggage', 'sentry-trace'],
    },
};

export default withSentryConfig(nextConfig, {
    ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
    ...(process.env.SENTRY_PROJECT
        ? { project: process.env.SENTRY_PROJECT }
        : {}),
    silent: true,
    widenClientFileUpload: true,
});

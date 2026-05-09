import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
    ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
    ...(process.env.SENTRY_PROJECT
        ? { project: process.env.SENTRY_PROJECT }
        : {}),
    silent: true,
    widenClientFileUpload: true,
    automaticVercelMonitors: false,
});

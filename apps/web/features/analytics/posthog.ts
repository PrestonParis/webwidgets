'use client';

import type { PostHog } from 'posthog-js';

let _posthog: PostHog | null = null;

/** Initialises the PostHog client once. Safe to call multiple times. */
export async function initPostHog(): Promise<PostHog | null> {
    if (typeof window === 'undefined') return null;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    if (!key) return null;
    if (_posthog) return _posthog;

    const { default: posthog } = await import('posthog-js');
    posthog.init(key, { api_host: host, capture_pageview: false });
    _posthog = posthog;
    return posthog;
}

/** Returns the PostHog instance if already initialised and PostHog key exists. */
export function getPostHog(): PostHog | null {
    return _posthog;
}

/** Identifies the current user in PostHog. Safe to call even if PostHog is not configured. */
export function identifyUser(
    userId: string,
    traits?: Record<string, unknown>,
): void {
    _posthog?.identify(
        userId,
        traits as Record<string, string | boolean | number>,
    );
}

/** Captures a client-side event. No-ops if PostHog is not initialised. */
export function captureEvent(
    name: string,
    properties?: Record<string, unknown>,
): void {
    _posthog?.capture(name, properties);
}

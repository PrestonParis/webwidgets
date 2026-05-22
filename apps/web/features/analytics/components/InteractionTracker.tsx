'use client';

import { useEffect } from 'react';
import { ANALYTICS_EVENTS } from '@/features/analytics/eventNames';
import {
    flushAnalyticsEvents,
    trackEvent,
} from '@/features/analytics/trackEventClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

const INTERACTIVE_SELECTOR =
    'button, a[href], [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary';

function cleanLabel(value: string | null | undefined) {
    return value?.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined;
}

function elementLabel(element: Element) {
    if (element instanceof HTMLInputElement) {
        return cleanLabel(
            element.getAttribute('aria-label') ||
                element.value ||
                element.name ||
                element.id,
        );
    }

    return cleanLabel(
        element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            element.textContent,
    );
}

function safeHref(element: Element) {
    if (!(element instanceof HTMLAnchorElement)) return undefined;
    try {
        const url = new URL(element.href);
        return `${url.pathname}${url.search}`;
    } catch {
        return undefined;
    }
}

export function InteractionTracker() {
    const { userId } = useAuth();

    useEffect(() => {
        const trackClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const interactive = target.closest(INTERACTIVE_SELECTOR);
            if (!interactive) return;

            trackEvent({
                type: ANALYTICS_EVENTS.USER_INTERACTION,
                source: 'global-click-capture',
                ...(userId ? { userId } : {}),
                metadata: {
                    action: 'click',
                    tag: interactive.tagName.toLowerCase(),
                    role: interactive.getAttribute('role') || undefined,
                    label: elementLabel(interactive),
                    href: safeHref(interactive),
                    path: window.location.pathname,
                },
            });
        };

        const trackSubmit = (event: SubmitEvent) => {
            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;

            trackEvent({
                type: ANALYTICS_EVENTS.USER_INTERACTION,
                source: 'global-submit-capture',
                ...(userId ? { userId } : {}),
                metadata: {
                    action: 'submit',
                    formId: form.id || undefined,
                    formName: form.getAttribute('name') || undefined,
                    path: window.location.pathname,
                },
            });
        };

        document.addEventListener('click', trackClick, true);
        document.addEventListener('submit', trackSubmit, true);
        window.addEventListener('pagehide', flushAnalyticsEvents);
        return () => {
            document.removeEventListener('click', trackClick, true);
            document.removeEventListener('submit', trackSubmit, true);
            window.removeEventListener('pagehide', flushAnalyticsEvents);
        };
    }, [userId]);

    return null;
}

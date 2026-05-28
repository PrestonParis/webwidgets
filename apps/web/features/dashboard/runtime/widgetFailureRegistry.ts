'use client';

import type { WidgetFailureReason } from '../types/widgetRuntime';

type FailureRecord = {
    count: number;
    cooldownUntil: number;
    disabled: boolean;
    lastReason?: WidgetFailureReason;
};

const failures = new Map<string, FailureRecord>();

export const WIDGET_FAILURE_COOLDOWNS_MS = [30_000, 120_000, 300_000];

export function getFailureRecord(key: string): FailureRecord | null {
    return failures.get(key) ?? null;
}

export function isInCooldown(key: string, now = Date.now()): boolean {
    const record = failures.get(key);
    if (!record) return false;
    if (record.disabled) return true;
    return record.cooldownUntil > now;
}

export function markResourceFailure(
    key: string,
    reason: WidgetFailureReason,
    now = Date.now(),
): FailureRecord {
    const previous = failures.get(key);
    const count = (previous?.count ?? 0) + 1;
    const cooldown =
        WIDGET_FAILURE_COOLDOWNS_MS[
            Math.min(count - 1, WIDGET_FAILURE_COOLDOWNS_MS.length - 1)
        ]!;
    const record: FailureRecord = {
        count,
        cooldownUntil: now + cooldown,
        disabled: count > WIDGET_FAILURE_COOLDOWNS_MS.length,
        lastReason: reason,
    };
    failures.set(key, record);
    if (process.env.NODE_ENV !== 'production') {
        console.info('[dashboard-runtime] fetch cooldown started', {
            key,
            count,
            cooldownMs: cooldown,
            disabled: record.disabled,
            reason,
        });
    }
    return record;
}

export function markResourceSuccess(key: string) {
    failures.delete(key);
}

export function clearResourceFailure(key: string) {
    failures.delete(key);
}

export function clearAllResourceFailures() {
    failures.clear();
}

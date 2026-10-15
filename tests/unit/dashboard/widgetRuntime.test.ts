import { describe, expect, it, beforeEach } from 'vitest';
import {
    clearAllResourceFailures,
    clearResourceFailure,
    isInCooldown,
    markResourceFailure,
} from '@/features/dashboard/runtime/widgetFailureRegistry';
import { getWidgetRuntimeMetadata } from '@/features/dashboard/runtime/widgetRuntimeMetadata';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

function widget(type: WidgetConfig['type']): WidgetConfig {
    return {
        id: `widget-${type}`,
        type,
        visible: true,
        columnSpan: 1,
        containerId: 'main',
        order: 0,
    };
}

describe('widget runtime metadata', () => {
    it('defers heavy widgets by default', () => {
        expect(getWidgetRuntimeMetadata(widget('developer'))).toMatchObject({
            weight: 'heavy',
            defaultLoad: 'deferred',
        });
    });

    it('keeps light widgets eligible for visible hydration', () => {
        expect(getWidgetRuntimeMetadata(widget('calculator'))).toMatchObject({
            weight: 'light',
            defaultLoad: 'visible',
        });
    });

    it('assigns data keys for failing widget routes', () => {
        expect(
            getWidgetRuntimeMetadata(widget('memorization')).dataKeys,
        ).toContain('/api/memory/cards');
        expect(getWidgetRuntimeMetadata(widget('reading')).dataKeys).toContain(
            '/api/bible',
        );
    });
});

describe('widget failure registry', () => {
    beforeEach(() => clearAllResourceFailures());

    it('puts failing resources into cooldown', () => {
        markResourceFailure('/api/memory/cards', {
            message: 'API 500',
            status: 500,
        });

        expect(isInCooldown('/api/memory/cards')).toBe(true);
    });

    it('allows manual retry to clear cooldown', () => {
        markResourceFailure('/api/bible', {
            message: 'API 503',
            status: 503,
        });
        clearResourceFailure('/api/bible');

        expect(isInCooldown('/api/bible')).toBe(false);
    });
});

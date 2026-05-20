import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
} from '@/features/widgets/types/widgetDefaults';

// Mirror of the schema used in useWidgetSettings and WidgetSettingsContext
const widgetSettingsPatchSchema = z
    .object({
        color: z
            .enum([
                'blue',
                'green',
                'amber',
                'purple',
                'red',
                'emerald',
                'zinc',
                'pink',
                'orange',
            ])
            .optional(),
        size: z.enum(['compact', 'default', 'large']).optional(),
        background: z.enum(['default', 'glass', 'solid']).optional(),
        view: z.enum(['timer', 'heatmap']).optional(),
    })
    .passthrough();

describe('widgetSettingsPatchSchema', () => {
    it('accepts a full valid settings object', () => {
        const result = widgetSettingsPatchSchema.safeParse({
            color: 'emerald',
            size: 'compact',
            background: 'glass',
        });
        expect(result.success).toBe(true);
    });

    it('accepts an empty object (all fields optional)', () => {
        expect(widgetSettingsPatchSchema.safeParse({}).success).toBe(true);
    });

    it('accepts a partial settings object', () => {
        const result = widgetSettingsPatchSchema.safeParse({ color: 'amber' });
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.color).toBe('amber');
        expect(result.data.size).toBeUndefined();
    });

    it('rejects an invalid color', () => {
        const result = widgetSettingsPatchSchema.safeParse({ color: 'yellow' });
        expect(result.success).toBe(false);
    });

    it('rejects an invalid size', () => {
        expect(
            widgetSettingsPatchSchema.safeParse({ size: 'huge' }).success,
        ).toBe(false);
    });

    it('accepts view=timer for recovery widgets', () => {
        const result = widgetSettingsPatchSchema.safeParse({
            color: 'purple',
            size: 'default',
            background: 'default',
            view: 'timer',
        });
        expect(result.success).toBe(true);
    });

    it('passes through unknown fields (stale DB data tolerance)', () => {
        const result = widgetSettingsPatchSchema.safeParse({
            color: 'blue',
            unknownField: true,
        });
        expect(result.success).toBe(true);
    });
});

describe('DEFAULT_WIDGET_SETTINGS', () => {
    it('has the expected shape', () => {
        expect(DEFAULT_WIDGET_SETTINGS.color).toBe('blue');
        expect(DEFAULT_WIDGET_SETTINGS.size).toBe('default');
        expect(DEFAULT_WIDGET_SETTINGS.background).toBe('default');
    });

    it('passes the settings schema', () => {
        const fullSchema = z.object({
            color: z.string(),
            size: z.string(),
            background: z.string(),
        });
        expect(fullSchema.safeParse(DEFAULT_WIDGET_SETTINGS).success).toBe(
            true,
        );
    });
});

describe('WIDGET_COLOR_DEFAULTS', () => {
    it('has a datahealth entry', () => {
        expect(WIDGET_COLOR_DEFAULTS.datahealth).toBeDefined();
    });

    it('all values are valid WidgetColors', () => {
        const validColors = new Set([
            'blue',
            'green',
            'amber',
            'purple',
            'red',
            'emerald',
            'zinc',
            'pink',
            'orange',
        ]);
        for (const [key, color] of Object.entries(WIDGET_COLOR_DEFAULTS)) {
            expect(validColors.has(color), `${key}: ${color}`).toBe(true);
        }
    });
});

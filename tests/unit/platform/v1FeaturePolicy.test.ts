import { describe, expect, it } from 'vitest';
import {
    getV1ReleaseState,
    isV1DefaultWidget,
} from '@/lib/product/v1FeaturePolicy';

describe('V1 feature policy', () => {
    it.each(['chess', 'creative', 'memorization', 'reading'])(
        'marks %s as suspended beta',
        (widgetType) => {
            expect(getV1ReleaseState(widgetType)).toBe('beta');
            expect(isV1DefaultWidget(widgetType)).toBe(false);
        },
    );

    it('keeps Timeline Intelligence in the stable V1 scope', () => {
        expect(getV1ReleaseState('news')).toBe('stable');
        expect(isV1DefaultWidget('news')).toBe(true);
    });

    it('keeps unlisted widgets stable by default', () => {
        expect(getV1ReleaseState('todo')).toBe('stable');
        expect(isV1DefaultWidget('todo')).toBe(true);
    });
});

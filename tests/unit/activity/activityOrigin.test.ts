import { describe, expect, it } from 'vitest';
import { mapActivityRow } from '@/features/activity/services/activityRows';

const baseRow = {
    id: '10000000-0000-4000-8000-000000000001',
    user_id: '11111111-1111-4111-8111-111111111111',
    source: 'automation',
    title: 'Automation completed',
};

describe('activity projection origin', () => {
    it('defaults legacy activity rows to the domain origin', () => {
        expect(mapActivityRow(baseRow).origin).toBe('domain');
    });

    it('preserves the timeline projection marker used for loop prevention', () => {
        expect(
            mapActivityRow({
                ...baseRow,
                origin: 'timeline_projection',
            }).origin,
        ).toBe('timeline_projection');
    });
});

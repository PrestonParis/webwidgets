import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    localScheduleKey,
    nextLocalSchedule,
} from '../automation/automationScheduler.js';

void describe('bounded automation local scheduling', () => {
    void it('keeps the selected wall time after the spring DST change', () => {
        const next = nextLocalSchedule(
            new Date('2026-03-07T14:00:00.000Z'),
            {
                localTime: '09:00',
                timezone: 'America/New_York',
                frequency: 'daily',
            },
            '2026-03-07',
        );
        assert.equal(next.toISOString(), '2026-03-08T13:00:00.000Z');
        assert.equal(localScheduleKey(next, 'America/New_York'), '2026-03-08');
    });

    void it('does not schedule twice in the repeated fall DST hour', () => {
        const first = new Date('2026-11-01T05:30:00.000Z');
        const next = nextLocalSchedule(
            first,
            {
                localTime: '01:30',
                timezone: 'America/New_York',
                frequency: 'daily',
            },
            localScheduleKey(first, 'America/New_York'),
        );
        assert.equal(next.toISOString(), '2026-11-02T06:30:00.000Z');
    });

    void it('bounds stale-task review to Mondays', () => {
        const next = nextLocalSchedule(new Date('2026-08-29T12:00:00.000Z'), {
            localTime: '09:00',
            timezone: 'America/New_York',
            frequency: 'weekly',
        });
        assert.equal(next.toISOString(), '2026-08-31T13:00:00.000Z');
    });
});

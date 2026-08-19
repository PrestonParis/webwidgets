import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchGmailSignals } from '../provider/gmailProvider.js';
import { fetchGoogleCalendarSignals } from '../provider/googleCalendarProvider.js';

const originalFetch = globalThis.fetch;

function requestUrl(input: string | URL | Request) {
    if (typeof input === 'string') return input;
    return input instanceof URL ? input.href : input.url;
}

void afterEach(() => {
    globalThis.fetch = originalFetch;
});

void describe('provider cursor pagination', () => {
    void it('reads every Gmail history page before advancing the cursor', async () => {
        const requested: string[] = [];
        globalThis.fetch = (input) => {
            const url = requestUrl(input);
            requested.push(url);
            const secondPage = url.includes('pageToken=page-2');
            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        history: [
                            {
                                messagesDeleted: [
                                    {
                                        message: {
                                            id: secondPage
                                                ? 'message-2'
                                                : 'message-1',
                                        },
                                    },
                                ],
                            },
                        ],
                        historyId: secondPage ? 'cursor-3' : 'cursor-2',
                        ...(secondPage ? {} : { nextPageToken: 'page-2' }),
                    }),
                    { status: 200 },
                ),
            );
        };
        const result = await fetchGmailSignals('token', 'cursor-1', 20);
        assert.equal(requested.length, 2);
        assert.deepEqual(
            result.signals.map((signal) => signal.objectId).sort(),
            ['message-1', 'message-2'],
        );
        assert.equal(result.cursor, 'cursor-3');
    });

    void it('reads every Calendar page and retains sparse cancellations', async () => {
        globalThis.fetch = (input) => {
            const secondPage = requestUrl(input).includes('pageToken=page-2');
            return Promise.resolve(
                new Response(
                    JSON.stringify(
                        secondPage
                            ? {
                                  items: [
                                      {
                                          id: 'event-2',
                                          status: 'cancelled',
                                          updated: '2026-08-18T11:00:00Z',
                                      },
                                  ],
                                  nextSyncToken: 'calendar-cursor-2',
                              }
                            : {
                                  items: [
                                      {
                                          id: 'event-1',
                                          updated: '2026-08-18T10:00:00Z',
                                          start: {
                                              dateTime: '2026-08-20T14:00:00Z',
                                          },
                                      },
                                  ],
                                  nextPageToken: 'page-2',
                              },
                    ),
                    { status: 200 },
                ),
            );
        };
        const result = await fetchGoogleCalendarSignals('token', undefined, 20);
        assert.equal(result.signals.length, 2);
        assert.equal(result.signals[1]?.change, 'cancelled');
        assert.equal(result.signals[1]?.start, '2026-08-18T11:00:00.000Z');
        assert.equal(result.cursor, 'calendar-cursor-2');
    });
});

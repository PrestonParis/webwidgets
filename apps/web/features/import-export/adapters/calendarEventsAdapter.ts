// Calendar Events adapter — wraps the server-side calendarService to expose
// upcoming calendar events through the import-export adapter layer.
// Import is not supported — Google Calendar / Outlook events must be managed
// through their respective APIs; we only read them here.
//
// inlinePayload (used by the dashboard runtime):
//   { events: CalendarWidgetEvent[]; isNotConnected: boolean }
//
// The CalendarWidget reads payload.sources['calendar_events'].data as
// CalendarAdapterPayload. The nested start/end format matches CalendarEvent
// so the widget can use eventStart(), isAllDay(), formatEventTime() directly.

import { getCalendarSnapshot } from '@/features/calendar/server/calendarService';
import { createClients } from '@/lib/supabase/serverClient';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';

const DEFAULT_DAYS_AHEAD = 45;

// Mirrors CalendarEventTime / CalendarEvent from @/features/calendar/types/calendar.
// Duplicated to avoid a server→client import cycle (types/calendar is 'use client').
interface CalendarEventTime {
    dateTime?: string;
    date?: string;
    timeZone?: string;
}

export interface CalendarWidgetEvent {
    id: string;
    summary: string;
    description: string | null;
    location: string | null;
    start: CalendarEventTime;
    end: CalendarEventTime;
    htmlLink: string;
    colorId?: string;
}

// Shape of the inlinePayload returned to the runtime.
export interface CalendarAdapterPayload {
    events: CalendarWidgetEvent[];
    isNotConnected: boolean;
}

// Converts a NormalizedEvent ISO start string into a CalendarEventTime object.
// All-day events use YYYY-MM-DD format (no 'T'); timed events use full ISO.
function toEventTime(isoOrDate: string): CalendarEventTime {
    if (!isoOrDate.includes('T')) {
        return { date: isoOrDate };
    }
    return { dateTime: isoOrDate };
}

export const calendarEventsAdapter: ImportExportAdapter = {
    id: 'calendar_events',
    displayName: 'Calendar Events',
    description: 'Upcoming calendar events from Google Calendar and Outlook',
    sourceType: 'calendar_events',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabaseAdmin } = await createClients();
            const { error } = await supabaseAdmin
                .from('user_tokens')
                .select('has_calendar')
                .limit(1);
            if (error) {
                return {
                    available: false,
                    message:
                        'Calendar token table unavailable: ' + error.message,
                };
            }
            return { available: true };
        } catch (e) {
            return {
                available: false,
                message: e instanceof Error ? e.message : 'Unknown error',
            };
        }
    },

    async exportData(
        userId: string,
        options?: ExportOptions,
    ): Promise<ExportResult> {
        const { supabaseAdmin } = await createClients();
        const warnings: string[] = [];

        // Determine the fetch window.
        // If startDate/endDate are provided, fetch enough days to cover the range.
        // getCalendarSnapshot uses a daysAhead window from today, so we calculate
        // the distance from today to the requested endDate.
        let daysAhead = DEFAULT_DAYS_AHEAD;
        let filterStart: Date | null = null;
        let filterEnd: Date | null = null;

        if (options?.startDate ?? options?.endDate) {
            const now = new Date();
            if (options?.startDate) filterStart = new Date(options.startDate);
            if (options?.endDate) {
                filterEnd = new Date(options.endDate);
                const msToEnd = filterEnd.getTime() - now.getTime();
                daysAhead = Math.max(
                    DEFAULT_DAYS_AHEAD,
                    Math.ceil(msToEnd / 86_400_000) + 1,
                );
            }
        }

        try {
            const snapshot = await getCalendarSnapshot(
                supabaseAdmin,
                userId,
                daysAhead,
            );

            if (snapshot.connectedProviders.length === 0) {
                warnings.push(
                    'No calendar providers connected. Connect Google Calendar or Outlook in Settings → Integrations.',
                );
                const emptyPayload: CalendarAdapterPayload = {
                    events: [],
                    isNotConnected: true,
                };
                return {
                    rows: [],
                    totalCount: 0,
                    warnings,
                    inlinePayload: emptyPayload,
                };
            }

            let events = snapshot.events;

            // Filter to the requested date range if specified
            if (filterStart ?? filterEnd) {
                events = events.filter((e) => {
                    const eventStart = new Date(e.start);
                    if (filterStart && eventStart < filterStart) return false;
                    if (filterEnd && eventStart > filterEnd) return false;
                    return true;
                });
            }

            const maxEvents = options?.limit ?? 200;
            const limited = events.slice(0, maxEvents);

            // Flat rows for CSV/JSON export (ISO start/end strings)
            const rows: MappedRow[] = limited.map((event, i) => ({
                rowIndex: i,
                data: {
                    id: event.id,
                    provider: event.provider,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay,
                    location: event.location ?? '',
                    description: event.description ?? '',
                    htmlLink: event.htmlLink ?? '',
                    status: event.status ?? 'confirmed',
                },
            }));

            // Rich inline payload for the dashboard runtime: returns CalendarWidgetEvent[]
            // with nested start/end objects so CalendarWidget helpers work directly.
            const widgetEvents: CalendarWidgetEvent[] = limited.map(
                (event) => ({
                    id: event.id,
                    summary: event.title,
                    description: event.description ?? null,
                    location: event.location ?? null,
                    start: toEventTime(event.start),
                    end: toEventTime(event.end),
                    htmlLink: event.htmlLink ?? '',
                }),
            );

            const inlinePayload: CalendarAdapterPayload = {
                events: widgetEvents,
                isNotConnected: false,
            };

            return { rows, totalCount: rows.length, warnings, inlinePayload };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (
                msg.includes('not configured') ||
                msg.includes('No tokens') ||
                msg.includes('not_configured')
            ) {
                warnings.push(
                    'Calendar not connected. Configure Google Calendar or Outlook in Settings.',
                );
                const disconnectedPayload: CalendarAdapterPayload = {
                    events: [],
                    isNotConnected: true,
                };
                return {
                    rows: [],
                    totalCount: 0,
                    warnings,
                    inlinePayload: disconnectedPayload,
                };
            }
            throw err;
        }
    },

    mapToContext: getContextMapper('calendar_events'),
};

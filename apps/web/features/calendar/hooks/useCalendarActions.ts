import { useCallback, useEffect, useState } from 'react';
import type {
    CalendarActionRequest,
    CalendarWorkspace,
} from '@/lib/calendarActions/receipts';
import { calendarActionPayloadSchema } from '@/lib/calendarActions/contracts';
import {
    decideCalendar,
    loadCalendarActions,
    proposeCalendar,
    reconcileCalendar,
    undoCalendar,
} from '../api/calendarActions';
const empty = {
    accountId: '',
    title: '',
    description: '',
    location: '',
    startsAt: '',
    endsAt: '',
    attendees: '',
    allDay: false,
};
export function useCalendarActions() {
    const [workspace, setWorkspace] = useState<CalendarWorkspace | null>(null);
    const [form, setForm] = useState(empty);
    const [review, setReview] = useState<CalendarActionRequest | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [key, setKey] = useState(() => crypto.randomUUID());
    const apply = useCallback((data: CalendarWorkspace) => {
        setWorkspace(data);
        setForm((old) =>
            old.accountId
                ? old
                : { ...old, accountId: data.accounts[0]?.id ?? '' },
        );
        setReview((old) =>
            old ? (data.requests.find((r) => r.id === old.id) ?? old) : null,
        );
    }, []);
    async function refresh() {
        apply(await loadCalendarActions());
    }
    useEffect(() => {
        let active = true;
        void loadCalendarActions()
            .then((data) => {
                if (active) apply(data);
            })
            .catch(() => {
                if (active)
                    setNotice('Calendar actions are not available yet.');
            });
        return () => {
            active = false;
        };
    }, [apply]);
    async function perform(operation: () => Promise<void>) {
        setBusy(true);
        setNotice('');
        try {
            await operation();
            await refresh();
        } catch (error) {
            setNotice(
                error instanceof Error
                    ? error.message
                    : 'Calendar action failed.',
            );
        } finally {
            setBusy(false);
        }
    }
    function edit(field: keyof typeof empty, value: string | boolean) {
        setForm({ ...form, [field]: value });
        setReview(null);
        setKey(crypto.randomUUID());
        setNotice('');
    }
    async function prepare() {
        await perform(async () => {
            const account = workspace?.accounts.find(
                (a) => a.id === form.accountId,
            );
            if (!account) throw new Error('Select a Google Calendar account.');
            const attendees = form.attendees
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);
            const base = {
                provider: 'google' as const,
                accountId: account.id,
                calendarId: 'primary' as const,
                title: form.title,
                description: form.description || null,
                location: form.location || null,
                attendees,
            };
            const candidate = form.allDay
                ? {
                      ...base,
                      allDay: true as const,
                      startDate: form.startsAt,
                      endDate: form.endsAt,
                  }
                : {
                      ...base,
                      allDay: false as const,
                      startsAt: new Date(form.startsAt).toISOString(),
                      endsAt: new Date(form.endsAt).toISOString(),
                      timezone:
                          Intl.DateTimeFormat().resolvedOptions().timeZone,
                  };
            const parsed = calendarActionPayloadSchema.safeParse(candidate);
            if (!parsed.success)
                throw new Error(
                    'Check the title, dates, timezone and attendee addresses.',
                );
            setReview(await proposeCalendar(parsed.data, key));
        });
    }
    async function decide(decision: 'approved' | 'denied') {
        if (!review) return;
        await perform(async () => {
            const result = await decideCalendar(review, decision);
            setReview(decision === 'approved' ? result.request : null);
            setNotice(
                result.queued ? 'Approved and queued.' : 'Decision saved.',
            );
        });
    }
    return {
        workspace,
        form,
        review,
        busy,
        notice,
        edit,
        prepare,
        approve: () => decide('approved'),
        deny: () => decide('denied'),
        refresh: () => perform(() => Promise.resolve()),
        reconcile: (id: string) =>
            perform(async () => {
                await reconcileCalendar(id);
                setNotice('Read-only reconciliation queued.');
            }),
        undo: (id: string) =>
            perform(async () => {
                const result = await undoCalendar(id);
                setNotice(
                    result.cancelled
                        ? 'Event cancellation verified.'
                        : 'Cancellation could not be verified.',
                );
            }),
    };
}

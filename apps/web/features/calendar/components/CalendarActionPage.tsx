'use client';
import Link from 'next/link';
import { useCalendarActions } from '../hooks/useCalendarActions';
export function CalendarActionPage() {
    const c = useCalendarActions();
    const { workspace, form, review, busy } = c;
    const locked =
        busy || Boolean(review && review.approval_state !== 'required');
    return (
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            <Link href="/planning" className="text-sm text-blue-600">
                ← Planning
            </Link>
            <div>
                <h1 className="text-2xl font-semibold">
                    Approval-gated calendar action
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Review the exact event before creation. Guests receive
                    invitations. Cancellation is a separate action.
                </p>
            </div>
            {!workspace?.enabled && (
                <p className="rounded-xl border p-4">
                    Provider actions are awaiting deployment verification.
                </p>
            )}
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <label className="block text-sm">
                    Calendar account
                    <select
                        className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                        value={form.accountId}
                        disabled={locked}
                        onChange={(e) => c.edit('accountId', e.target.value)}
                    >
                        <option value="">Select account</option>
                        {workspace?.accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.email}
                            </option>
                        ))}
                    </select>
                </label>
                {(['title', 'location', 'attendees'] as const).map((field) => (
                    <label key={field} className="block text-sm capitalize">
                        {field}
                        <input
                            className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                            value={form[field]}
                            disabled={locked}
                            required={field === 'title'}
                            onChange={(e) => c.edit(field, e.target.value)}
                        />
                    </label>
                ))}
                <p className="text-xs text-gray-500">
                    Separate guest addresses with commas.
                </p>
                <label className="flex gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.allDay}
                        disabled={locked}
                        onChange={(e) => c.edit('allDay', e.target.checked)}
                    />
                    All-day event
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                        Start
                        <input
                            type={form.allDay ? 'date' : 'datetime-local'}
                            className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                            value={form.startsAt}
                            disabled={locked}
                            onChange={(e) => c.edit('startsAt', e.target.value)}
                        />
                    </label>
                    <label className="text-sm">
                        End {form.allDay ? '(exclusive)' : ''}
                        <input
                            type={form.allDay ? 'date' : 'datetime-local'}
                            className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                            value={form.endsAt}
                            disabled={locked}
                            onChange={(e) => c.edit('endsAt', e.target.value)}
                        />
                    </label>
                </div>
                <label className="block text-sm">
                    Description
                    <textarea
                        rows={4}
                        className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                        value={form.description}
                        disabled={locked}
                        onChange={(e) => c.edit('description', e.target.value)}
                    />
                </label>
                <button
                    type="button"
                    disabled={locked || !workspace?.enabled}
                    onClick={() => void c.prepare()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                    Review event
                </button>
            </form>
            {review && (
                <section className="space-y-3 rounded-xl border border-blue-500/40 p-5">
                    <h2 className="font-semibold">Exact event review</h2>
                    <p>{review.payload.title}</p>
                    <p className="text-sm">
                        {review.payload.allDay
                            ? `${review.payload.startDate} through ${review.payload.endDate} (exclusive end)`
                            : `${review.payload.startsAt} – ${review.payload.endsAt} (${review.payload.timezone})`}
                    </p>
                    <p className="text-sm">
                        Guests: {review.payload.attendees.join(', ') || 'None'}
                    </p>
                    <pre className="whitespace-pre-wrap text-sm">
                        {review.payload.description}
                    </pre>
                    <div className="flex gap-3">
                        <button
                            disabled={busy}
                            onClick={() => void c.approve()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                        >
                            Approve creation and invitations
                        </button>
                        {review.approval_state === 'required' && (
                            <button
                                disabled={busy}
                                onClick={() => void c.deny()}
                                className="rounded-lg border px-4 py-2"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </section>
            )}
            {c.notice && (
                <p role="status" className="rounded-lg border p-3 text-sm">
                    {c.notice}
                </p>
            )}
            <section className="space-y-3">
                <h2 className="font-semibold">Recent actions</h2>
                {workspace?.requests.map((r) => {
                    const outcome = workspace.outcomes.find(
                        (o) => o.action_request_id === r.id,
                    );
                    return (
                        <article key={r.id} className="rounded-xl border p-4">
                            <p>{r.payload.title}</p>
                            <p className="text-sm">
                                {outcome?.receipt?.code ?? r.status}
                            </p>
                            <div className="mt-2 flex gap-3">
                                {outcome?.receipt?.state === 'verified' &&
                                    outcome.undo_state === 'available' && (
                                        <button
                                            disabled={busy}
                                            onClick={() => void c.undo(r.id)}
                                            className="text-sm underline"
                                        >
                                            Cancel event
                                        </button>
                                    )}
                                {outcome?.receipt?.state === 'unknown' && (
                                    <button
                                        disabled={busy}
                                        onClick={() => void c.reconcile(r.id)}
                                        className="text-sm underline"
                                    >
                                        Check provider state (no duplicate)
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}

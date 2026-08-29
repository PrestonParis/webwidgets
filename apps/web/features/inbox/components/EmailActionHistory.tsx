import type { EmailWorkspace } from '@/lib/emailActions/receipts';

export function EmailActionHistory({
    workspace,
    busy,
    reconcile,
}: {
    workspace: EmailWorkspace;
    busy: boolean;
    reconcile: (id: string) => Promise<void>;
}) {
    return (
        <section className="space-y-3" aria-labelledby="email-history">
            <h2 id="email-history" className="text-lg font-semibold">
                Recent email actions
            </h2>
            {workspace.requests.length === 0 && (
                <p className="text-sm text-gray-500">
                    No drafts or sends requested yet.
                </p>
            )}
            {workspace.requests.map((action) => {
                const outcome = workspace.outcomes.find(
                    (item) => item.action_request_id === action.id,
                );
                const receipt = outcome?.receipt;
                const uncertain = Boolean(
                    outcome && (!receipt || receipt.state === 'unknown'),
                );
                const label =
                    receipt?.state === 'verified'
                        ? action.action_id === 'email.draft'
                            ? 'Draft verified in Gmail'
                            : 'Verified in Sent; delivery not confirmed'
                        : uncertain
                          ? 'Outcome unknown—do not resend'
                          : receipt?.state === 'failed'
                            ? 'Blocked or rejected'
                            : action.status;
                return (
                    <article
                        key={action.id}
                        className="space-y-2 rounded-xl border p-4"
                    >
                        <p className="break-words font-medium">
                            {action.payload.subject}
                        </p>
                        <p className="break-all text-sm">
                            {action.action_id === 'email.draft'
                                ? 'Draft'
                                : 'Send'}{' '}
                            · {action.payload.from}
                        </p>
                        <p role="status" className="text-sm">
                            {label}
                        </p>
                        {receipt?.providerObjectId && (
                            <p className="break-all text-xs text-gray-500">
                                Provider reference: {receipt.providerObjectId}
                            </p>
                        )}
                        {uncertain && (
                            <button
                                type="button"
                                disabled={busy}
                                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                                onClick={() => void reconcile(action.id)}
                            >
                                Check provider state (no resend)
                            </button>
                        )}
                    </article>
                );
            })}
        </section>
    );
}

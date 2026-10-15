import type { EmailActionRequest } from '@/lib/emailActions/receipts';

export function EmailReview({
    action,
    busy,
    approve,
    abandon,
}: {
    action: EmailActionRequest;
    busy: boolean;
    approve: () => Promise<void>;
    abandon: () => Promise<void>;
}) {
    const message = action.payload;
    const send = action.action_id === 'email.send';
    const decided = action.approval_state !== 'required';
    return (
        <section
            aria-labelledby="email-review"
            className="space-y-4 rounded-xl border border-blue-500/40 p-5"
        >
            <h2 id="email-review" className="text-lg font-semibold">
                Review {send ? 'send' : 'draft'} approval
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt>Provider</dt>
                <dd>{message.provider === 'google' ? 'Gmail' : 'Outlook'}</dd>
                <dt>From</dt>
                <dd className="break-all">{message.from}</dd>
                <dt>To</dt>
                <dd className="break-all">{message.to.join(', ')}</dd>
                <dt>Cc</dt>
                <dd className="break-all">{message.cc.join(', ') || 'None'}</dd>
                <dt>Bcc</dt>
                <dd className="break-all">
                    {message.bcc.join(', ') || 'None'}
                </dd>
                <dt>Subject</dt>
                <dd className="break-words">{message.subject}</dd>
                <dt>Thread</dt>
                <dd>New message</dd>
            </dl>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/5 p-3 font-sans text-sm dark:bg-white/5">
                {message.body}
            </pre>
            <p className="text-sm">
                {send
                    ? 'This sends the exact message above. Sending cannot be undone. Provider acceptance does not prove recipient delivery.'
                    : `This creates a ${message.provider === 'google' ? 'Gmail' : 'Outlook'} draft only. Sending requires a separate review and approval.`}
            </p>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={
                        busy ||
                        action.status === 'completed' ||
                        action.status === 'failed'
                    }
                    onClick={() => void approve()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                    {decided
                        ? 'Retry queue delivery'
                        : send
                          ? 'Approve and send this message'
                          : 'Approve draft creation'}
                </button>
                {!decided && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void abandon()}
                        className="rounded-lg border px-4 py-2"
                    >
                        Cancel request
                    </button>
                )}
            </div>
        </section>
    );
}

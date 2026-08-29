import type { useEmailComposer } from '../hooks/useEmailComposer';

const fields = [
    ['to', 'To'],
    ['cc', 'Cc'],
    ['bcc', 'Bcc'],
    ['subject', 'Subject'],
] as const;

export function EmailComposerForm({
    composer,
}: {
    composer: ReturnType<typeof useEmailComposer>;
}) {
    const { workspace, form, busy, review } = composer;
    const locked =
        busy || Boolean(review && review.approval_state !== 'required');
    return (
        <form
            className="space-y-4"
            onSubmit={(event) => event.preventDefault()}
        >
            <label className="block text-sm">
                Sending account
                <select
                    value={form.accountId}
                    disabled={locked}
                    onChange={(event) =>
                        composer.edit('accountId', event.target.value)
                    }
                    className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                >
                    <option value="">Select email account</option>
                    {workspace?.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.email} ·{' '}
                            {account.provider === 'google'
                                ? 'Gmail'
                                : 'Outlook'}
                        </option>
                    ))}
                </select>
            </label>
            {fields.map(([field, label]) => (
                <label key={field} className="block text-sm">
                    {label}
                    <input
                        value={form[field]}
                        disabled={locked}
                        onChange={(event) =>
                            composer.edit(field, event.target.value)
                        }
                        required={field === 'to' || field === 'subject'}
                        maxLength={field === 'subject' ? 998 : 7000}
                        className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                    />
                </label>
            ))}
            <p className="text-xs text-gray-500">
                Separate recipients with commas. Up to 20 recipients total,
                including Cc and Bcc.
            </p>
            <label className="block text-sm">
                Message
                <textarea
                    value={form.body}
                    disabled={locked}
                    onChange={(event) =>
                        composer.edit('body', event.target.value)
                    }
                    required
                    maxLength={50000}
                    rows={9}
                    className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                />
            </label>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={locked || !composer.can('email.draft')}
                    onClick={() => void composer.prepare('email.draft')}
                    className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                    Review draft
                </button>
                <button
                    type="button"
                    disabled={locked || !composer.can('email.send')}
                    onClick={() => void composer.prepare('email.send')}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                    Review send
                </button>
            </div>
        </form>
    );
}

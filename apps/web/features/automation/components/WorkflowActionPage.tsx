'use client';
import Link from 'next/link';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
export function WorkflowActionPage() {
    const c = useWorkflowActions();
    const { workspace, review, busy } = c;
    const locked =
        busy || Boolean(review && review.approval_state !== 'required');
    return (
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            <Link href="/automation" className="text-sm text-blue-600">
                ← Automation Center
            </Link>
            <div>
                <h1 className="text-2xl font-semibold">
                    Run configured workflow
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Only enabled, owner-configured workflow keys can run.
                    Parameters and provider execution require exact approval.
                </p>
            </div>
            {!workspace?.enabled && (
                <p className="rounded-xl border p-4">
                    Provider actions are awaiting deployment verification.
                </p>
            )}
            {workspace && !workspace.configured && (
                <p className="rounded-xl border border-amber-400 p-4">
                    n8n is not configured. Requests will fail explicitly;
                    WebWidgets will never report a fabricated run.
                </p>
            )}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <label className="block text-sm">
                    Configured workflow
                    <select
                        value={c.configId}
                        disabled={locked}
                        onChange={(e) => c.editConfig(e.target.value)}
                        className="mt-1 block w-full rounded-lg border bg-transparent p-3"
                    >
                        <option value="">Select workflow</option>
                        {workspace?.configs.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} · {item.workflowKey}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm">
                    Typed parameters (JSON)
                    <textarea
                        rows={9}
                        value={c.parameters}
                        disabled={locked}
                        onChange={(e) => c.editParameters(e.target.value)}
                        className="mt-1 block w-full rounded-lg border bg-transparent p-3 font-mono text-sm"
                    />
                </label>
                <button
                    type="button"
                    disabled={locked || !workspace?.enabled}
                    onClick={() => void c.prepare()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                    Review workflow run
                </button>
            </form>
            {review && (
                <section className="space-y-3 rounded-xl border border-blue-500/40 p-5">
                    <h2 className="font-semibold">Exact workflow review</h2>
                    <p>{review.payload.workflowKey}</p>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-black/5 p-3 text-sm">
                        {JSON.stringify(review.payload.parameters, null, 2)}
                    </pre>
                    <p className="text-sm">
                        n8n executes this request, but WebWidgets remains the
                        approval and run-history owner.
                    </p>
                    <div className="flex gap-3">
                        <button
                            disabled={busy}
                            onClick={() => void c.approve()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                        >
                            Approve workflow run
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
                <h2 className="font-semibold">Recent runs</h2>
                {workspace?.requests.map((r) => {
                    const receipt = workspace.outcomes.find(
                        (o) => o.action_request_id === r.id,
                    )?.receipt;
                    return (
                        <article key={r.id} className="rounded-xl border p-4">
                            <p>{r.payload.workflowKey}</p>
                            <p className="text-sm">
                                {receipt?.code ?? r.status}
                            </p>
                            {receipt?.providerObjectId && (
                                <p className="break-all text-xs text-gray-500">
                                    n8n run: {receipt.providerObjectId}
                                </p>
                            )}
                        </article>
                    );
                })}
            </section>
        </main>
    );
}

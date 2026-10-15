'use client';

import { useState, type FormEvent } from 'react';
import { useRssSources } from '@/features/integrations/hooks/useRssSources';

export function RssSourceManager() {
    const [url, setUrl] = useState('');
    const { query, add, remove } = useRssSources();

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        add.mutate(url, { onSuccess: () => setUrl('') });
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div>
                <h2 className="text-base font-semibold">
                    RSS and Atom sources
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Add public feeds you trust. WebWidgets checks them every 30
                    minutes.
                </p>
            </div>
            <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={submit}
            >
                <label className="sr-only" htmlFor="rss-source-url">
                    RSS or Atom feed URL
                </label>
                <input
                    id="rss-source-url"
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com/feed.xml"
                    required
                    type="url"
                    value={url}
                />
                <button
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={add.isPending}
                    type="submit"
                >
                    {add.isPending ? 'Adding…' : 'Add feed'}
                </button>
            </form>
            {add.error ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                    {add.error.message}
                </p>
            ) : null}
            <div className="mt-4 space-y-2">
                {query.isLoading ? (
                    <p className="text-sm">Loading sources…</p>
                ) : null}
                {query.data?.map((source) => (
                    <div
                        className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800"
                        key={source.id}
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {source.url}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {source.status}
                                {source.failureCount > 0
                                    ? ` · ${source.failureCount} failed attempts`
                                    : ''}
                            </p>
                        </div>
                        <button
                            aria-label={`Disable ${source.url}`}
                            className="text-sm font-medium text-red-600 disabled:opacity-50"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(source.id)}
                            type="button"
                        >
                            Disable
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

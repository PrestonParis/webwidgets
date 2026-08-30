import type { ReactNode } from 'react';
import Link from 'next/link';

export function SectionShell({
    title,
    description,
    href,
    linkLabel,
    loading,
    error,
    children,
}: {
    title: string;
    description: string;
    href?: string;
    linkLabel?: string;
    loading: boolean;
    error: boolean;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {description}
                    </p>
                </div>
                {href && linkLabel ? (
                    <Link
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        href={href}
                    >
                        {linkLabel}
                    </Link>
                ) : null}
            </header>
            {loading ? (
                <p className="py-6 text-sm text-zinc-500" role="status">
                    Loading…
                </p>
            ) : null}
            {error ? (
                <div
                    className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                    role="alert"
                >
                    This section is temporarily unavailable. Other command
                    center sections remain current.
                </div>
            ) : null}
            {!loading && !error ? children : null}
        </section>
    );
}

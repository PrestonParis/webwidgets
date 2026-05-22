import type { ReactNode } from 'react';

interface FoundationCardProps {
    title: string;
    description: string;
    status?: string;
    children?: ReactNode;
}

export function FoundationCard({
    title,
    description,
    status,
    children,
}: FoundationCardProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {description}
                    </p>
                </div>
                {status && (
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {status}
                    </span>
                )}
            </div>
            {children && <div className="mt-4">{children}</div>}
        </section>
    );
}

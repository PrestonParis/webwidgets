import type { ReactNode } from 'react';

interface ProductPageShellProps {
    title: string;
    eyebrow: string;
    description: string;
    children: ReactNode;
    aside?: ReactNode;
}

export function ProductPageShell({
    title,
    eyebrow,
    description,
    children,
    aside,
}: ProductPageShellProps) {
    return (
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
            <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6ef7]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {description}
                    </p>
                </div>
                {aside}
            </div>
            {children}
        </main>
    );
}

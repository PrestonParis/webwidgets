import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

export type PageWidth = 'full' | 'constrained' | 'narrow';

const widthClasses: Record<PageWidth, string> = {
    full: 'w-full',
    constrained: 'mx-auto max-w-7xl px-6 lg:px-12',
    narrow: 'mx-auto max-w-3xl px-6 lg:px-8',
};

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageWrapperProps {
    children: ReactNode;
    title?: string;
    description?: string;
    eyebrow?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    width?: PageWidth;
    className?: string;
    py?: string;
}

export function PageWrapper({
    children,
    title,
    description,
    eyebrow,
    breadcrumbs,
    actions,
    width = 'constrained',
    className,
    py = 'py-8',
}: PageWrapperProps) {
    const hasHeader = title ?? description ?? eyebrow ?? breadcrumbs ?? actions;

    return (
        <main className={cn(widthClasses[width], py, className)}>
            {hasHeader && (
                <div className="mb-7">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                            {breadcrumbs.map((crumb, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                    {idx > 0 && <ChevronRight size={12} className="shrink-0" />}
                                    {crumb.href ? (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-zinc-600 dark:text-zinc-300">{crumb.label}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            {eyebrow && (
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6ef7]">
                                    {eyebrow}
                                </p>
                            )}
                            {title && (
                                <h1 className={cn(
                                    'font-semibold text-zinc-950 dark:text-zinc-50',
                                    eyebrow ? 'mt-2 text-3xl' : 'text-2xl',
                                )}>
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {description}
                                </p>
                            )}
                        </div>
                        {actions && <div className="shrink-0">{actions}</div>}
                    </div>
                </div>
            )}
            {children}
        </main>
    );
}

interface PageSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function PageSection({ title, description, children, className }: PageSectionProps) {
    return (
        <section className={cn('space-y-4', className)}>
            {(title ?? description) && (
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    {title && (
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                    )}
                    {description && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}

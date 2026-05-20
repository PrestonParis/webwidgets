import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function AdminPageHeader({
    title,
    description,
    actions,
}: AdminPageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

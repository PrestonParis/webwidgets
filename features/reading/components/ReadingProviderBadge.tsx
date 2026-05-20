'use client';

import type { ReadingProvider } from '@/features/reading/types/providers';

interface ReadingProviderBadgeProps {
    provider: ReadingProvider;
}

export function ReadingProviderBadge({ provider }: ReadingProviderBadgeProps) {
    const caps = provider.capabilities;
    const tags: string[] = [];
    if (caps.fullText) tags.push('Full text');
    if (caps.search) tags.push('Search');
    if (caps.versionComparison) tags.push('Versions');
    if (caps.pdfRendering) tags.push('PDF');
    if (caps.aiSummarizationAllowed) tags.push('AI');

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {provider.name}
            </span>
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full"
                >
                    {tag}
                </span>
            ))}
        </div>
    );
}

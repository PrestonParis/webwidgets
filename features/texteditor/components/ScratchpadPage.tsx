'use client';

import { useQuickNote } from '@/features/scratchpad/hooks/useQuickNote';

export function ScratchpadPage() {
    const { content, updateContent, status, loaded } = useQuickNote();
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto px-10 py-12">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-600 mb-6">
                Scratchpad
            </h2>
            <textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={loaded ? 'Start writing anything…' : ''}
                disabled={!loaded}
                className="flex-1 resize-none text-[15px] leading-relaxed text-stone-800 dark:text-zinc-200 placeholder:text-stone-300 dark:placeholder:text-zinc-700 bg-transparent outline-none"
            />
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-zinc-800/60 mt-4">
                <span className="text-[11px] text-stone-400 dark:text-zinc-600">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span
                    className={`text-[11px] transition-opacity ${status === 'idle' ? 'opacity-0' : status === 'saving' ? 'text-stone-400 opacity-100' : 'text-emerald-500 opacity-100'}`}
                >
                    {status === 'saving' ? 'Saving…' : 'Saved'}
                </span>
            </div>
        </div>
    );
}

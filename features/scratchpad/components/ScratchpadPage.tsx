'use client';

import { FileText } from 'lucide-react';
import { useQuickNote } from '@/features/scratchpad/hooks/useQuickNote';

export function ScratchpadPage() {
    const { content, updateContent, status, loaded } = useQuickNote();

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    return (
        <main
            className="max-w-3xl mx-auto px-6 py-8 lg:px-12 flex flex-col"
            style={{ minHeight: 'calc(100vh - 56px)' }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileText
                        size={20}
                        className="text-stone-500 dark:text-zinc-400"
                    />
                    <h1 className="text-xl font-semibold text-stone-900 dark:text-zinc-100">
                        Scratchpad
                    </h1>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-zinc-600">
                    <span>
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                    <span>{charCount} chars</span>
                    <span
                        className={`transition-opacity ${
                            status === 'idle'
                                ? 'opacity-0'
                                : status === 'saving'
                                  ? 'text-stone-400 dark:text-zinc-600 opacity-100'
                                  : 'text-green-500 dark:text-green-400 opacity-100'
                        }`}
                    >
                        {status === 'saving' ? 'Saving…' : 'Saved'}
                    </span>
                </div>
            </div>

            <textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={loaded ? 'Start writing…' : ''}
                disabled={!loaded}
                className="flex-1 w-full resize-none text-base text-stone-700 dark:text-zinc-300 placeholder:text-stone-300 dark:placeholder:text-zinc-700 bg-transparent outline-none leading-relaxed font-mono"
                style={{ minHeight: '60vh' }}
            />
        </main>
    );
}

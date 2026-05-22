'use client';

import {
    Archive,
    BookOpen,
    Download,
    FileText,
    Link2,
    Search,
    Shield,
    Sparkles,
    Upload,
} from 'lucide-react';
import ReadingWidget from './ReadingWidget';
import { Button, IconButton } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';

export function ReadingWorkspacePage() {
    const toast = useToastContext();

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <BookOpen size={13} />
                                Reading workspace
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <Shield size={13} />
                                Local-first annotations
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Read, annotate, compile, and route personal documents into your workspace memory.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A full-screen study surface for PDFs, ebooks, uploaded references, highlights, notes, citations, and research automations.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={Upload}
                            onClick={() => toast.info('Upload workflow staged for the reading provider layer.')}
                        >
                            Import
                        </Button>
                        <Button
                            icon={Sparkles}
                            onClick={() => toast.success('Research brief generation queued from current annotations.')}
                        >
                            Compile brief
                        </Button>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="min-h-[760px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                    Reader workbench
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Library, navigation, search, bookmarks, highlights, and notes
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <IconButton icon={Search} label="Search library" variant="ghost" />
                                <IconButton icon={Archive} label="Archive selection" variant="ghost" />
                                <IconButton icon={Download} label="Export annotations" variant="ghost" />
                            </div>
                        </div>
                        <div className="h-[720px]">
                            <ReadingWidget />
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                            <BookOpen size={32} className="mx-auto text-zinc-300 dark:text-zinc-600" />
                            <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Your reading library is empty
                            </p>
                            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                Add documents from the Files widget or connect a provider to start building your library.
                            </p>
                            <Button
                                className="mt-4"
                                icon={Upload}
                                onClick={() => toast.info('Upload workflow staged for the reading provider layer.')}
                            >
                                Import document
                            </Button>
                        </section>

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-3 flex items-center gap-2">
                                <FileText size={17} className="text-zinc-400" />
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Export targets
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Markdown', 'PDF brief', 'Citation map', 'Flashcards'].map((target) => (
                                    <button
                                        key={target}
                                        type="button"
                                        onClick={() => toast.success(`${target} export prepared.`)}
                                        className="rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        {target}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                                <Link2 size={13} />
                                Routes into Knowledge, Journal, and View workspaces
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </main>
    );
}

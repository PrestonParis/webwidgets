'use client';
import { useJournalPage } from '@/features/journal/hooks/useJournalPage';
import { JournalHeader } from '@/features/journal/components/JournalHeader';
import { JournalForm } from '@/features/journal/components/JournalForm';
import { EmptyState } from '@/features/journal/components/EmptyState';
import EntryCard from '@/features/journal/components/EntryCard';
import { TIPTAP_STYLES } from '@/features/journal/constants';
import { JournalEntry } from '@/features/journal/types/journal';

export default function JournalPage() {
    const page = useJournalPage();

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: TIPTAP_STYLES }} />
            {page.focusMode && (
                <div
                    className="fixed inset-0 bg-stone-950/60 z-10 backdrop-blur-sm"
                    onClick={() => page.setFocusMode(false)}
                />
            )}

            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <JournalHeader entryCount={page.entryUtils.entries.length} />

                <JournalForm
                    {...page.editorUtils}
                    onTitleChange={page.editorUtils.setTitle}
                    isSaving={page.isSaving}
                    focusMode={page.focusMode}
                    onFocusToggle={() => page.setFocusMode((v) => !v)}
                    onCancel={() => {
                        if (
                            page.editorUtils.isDirty() &&
                            !window.confirm('Discard changes?')
                        )
                            return;
                        page.editorUtils.cancelEditing();
                    }}
                    onSubmit={page.handleSubmit}
                    wordCount={page.wordCount}
                    autosaved={page.autosaved}
                />

                <section className="lg:col-span-4 space-y-6">
                    {/* View & Search Controls */}
                    <div className="flex gap-4 border-b border-stone-100 dark:border-zinc-800 pb-2">
                        {(['all', 'trash'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => page.entryUtils.setView(v)}
                                className={`text-sm font-medium capitalize ${page.entryUtils.view === v ? 'text-amber-600' : 'text-stone-400'}`}
                            >
                                {v === 'all' ? 'Recent' : 'Trash'}
                            </button>
                        ))}
                    </div>

                    {page.entryUtils.view === 'all' && (
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Search entries…"
                                value={page.searchQuery}
                                onChange={(e) =>
                                    page.setSearchQuery(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border dark:bg-zinc-900 text-sm outline-none focus:border-amber-500"
                            />
                        </div>
                    )}

                    {page.filteredEntries.length === 0 ? (
                        <EmptyState
                            view={page.entryUtils.view}
                            hasSearchQuery={!!page.searchQuery}
                        />
                    ) : (
                        page.filteredEntries.map((entry: JournalEntry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onDelete={(id) => {
                                    void page.entryUtils.handleDelete(id);
                                }}
                                onEdit={page.editorUtils.startEditing}
                                onRestore={(id) => {
                                    void page.entryUtils.handleRestore(id);
                                }}
                                isTrash={page.entryUtils.view === 'trash'}
                            />
                        ))
                    )}
                </section>
            </main>
        </>
    );
}

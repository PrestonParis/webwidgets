'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { useJournalEditor } from '@/features/journal/hooks/useJournalEditor';
import { useAutosave } from '@/features/journal/hooks/useAutosave';
import { useJournalManager } from '@/features/journal/hooks/useJournalManager';
import { JournalHeader } from '@/features/journal/components/JournalHeader';
import { JournalForm } from '@/features/journal/components/JournalForm';
import { EmptyState } from '@/features/journal/components/EmptyState';
import EntryCard from '@/features/journal/components/EntryCard';
import { TIPTAP_STYLES } from '../../features/journal/constants';
import { JournalEntry } from '@/types/journal';

export default function JournalPage() {
    const { user } = useAuth();
    const [focusMode, setFocusMode] = useState(false);

    // Core Domain Hooks
    const entryUtils = useJournalEntries(user?.id);
    const editorUtils = useJournalEditor();
    const { autosaved, restoreDraft, clearDraft } = useAutosave(
        editorUtils.editor,
        editorUtils.title,
        !editorUtils.isEditing,
    );

    // Derived Logic Hook
    const {
        isSaving,
        searchQuery,
        setSearchQuery,
        handleSubmit,
        filteredEntries,
    } = useJournalManager(
        user,
        editorUtils.editor,
        editorUtils,
        entryUtils,
        clearDraft,
    );

    // Restore draft logic
    useEffect(() => {
        if (!editorUtils.isEditing && editorUtils.editor) {
            const draft = restoreDraft();
            if (draft) {
                editorUtils.setTitle(draft.title);
                editorUtils.editor.commands.setContent(draft.content);
            }
        }
    }, [editorUtils.editor, restoreDraft, editorUtils]);

    const wordCount = editorUtils.editor?.storage.characterCount.words() ?? 0;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: TIPTAP_STYLES }} />
            {focusMode && (
                <div
                    className="fixed inset-0 bg-stone-950/60 z-10 backdrop-blur-sm"
                    onClick={() => setFocusMode(false)}
                />
            )}

            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <JournalHeader entryCount={entryUtils.entries.length} />

                <JournalForm
                    {...editorUtils}
                    onTitleChange={editorUtils.setTitle}
                    isSaving={isSaving}
                    focusMode={focusMode}
                    onFocusToggle={() => setFocusMode((v) => !v)}
                    onCancel={() => {
                        if (
                            editorUtils.isDirty() &&
                            !window.confirm('Discard changes?')
                        )
                            return;
                        editorUtils.cancelEditing();
                    }}
                    onSubmit={handleSubmit}
                    wordCount={wordCount}
                    autosaved={autosaved}
                />

                <section className="lg:col-span-8 space-y-6">
                    {/* View & Search Controls */}
                    <div className="flex gap-4 border-b border-stone-100 dark:border-zinc-800 pb-2">
                        {(['all', 'trash'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => entryUtils.setView(v)}
                                className={`text-sm font-medium capitalize ${entryUtils.view === v ? 'text-amber-600' : 'text-stone-400'}`}
                            >
                                {v === 'all' ? 'Recent' : 'Trash'}
                            </button>
                        ))}
                    </div>

                    {entryUtils.view === 'all' && (
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Search entries…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border dark:bg-zinc-900 text-sm outline-none focus:border-amber-500"
                            />
                        </div>
                    )}

                    {filteredEntries.length === 0 ? (
                        <EmptyState
                            view={entryUtils.view}
                            hasSearchQuery={!!searchQuery}
                        />
                    ) : (
                        filteredEntries.map((entry: JournalEntry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onDelete={entryUtils.handleDelete}
                                onEdit={editorUtils.startEditing}
                                onRestore={entryUtils.handleRestore}
                                isTrash={entryUtils.view === 'trash'}
                            />
                        ))
                    )}
                </section>
            </main>
        </>
    );
}

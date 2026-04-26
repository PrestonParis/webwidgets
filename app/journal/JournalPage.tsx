import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback } from 'react';
import { useJournalEntries } from '@/hooks/Journal/useJournalEntries';
import { useJournalEditor } from '@/hooks/Journal/useJournalEditor';
import { useAutosave } from '@/hooks/Journal/useAutosave';
import { JournalHeader } from '@/components/Journal/JournalHeader';
import { JournalForm } from '@/components/Journal/JournalForm';
import { EmptyState } from '@/components/Journal/EmptyState';
import EntryCard from '@/components/Journal/EntryCard';
import { TIPTAP_STYLES } from './constants';
import { supabase } from '@/app/lib/supabase';

export default function JournalPage() {
    const { user } = useAuth();
    const [focusMode, setFocusMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const {
        entries,
        view,
        setView,
        refreshEntries,
        handleDelete,
        handleRestore,
    } = useJournalEntries(user?.id);
    const {
        editor,
        title,
        setTitle,
        editingId,
        isEditing,
        startEditing,
        cancelEditing,
        resetForm,
        getContent,
        isValid,
    } = useJournalEditor();

    const { autosaved, restoreDraft, clearDraft } = useAutosave(
        editor,
        title,
        !isEditing, // Only autosave when creating new entry
    );

    // Restore draft on mount
    useState(() => {
        if (!isEditing && editor) {
            const draft = restoreDraft();
            if (draft) {
                setTitle(draft.title);
                editor.commands.setContent(draft.content);
            }
        }
    });

    const handleSubmit = useCallback(
        async (e: React.SyntheticEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!user?.id || !editor || !isValid()) return;

            setIsSaving(true);
            const content = getContent();

            if (isEditing) {
                // Update existing entry logic
                const { error } = await supabase
                    .from('journals')
                    .update({
                        title: title.trim(),
                        content,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingId) // ← Now editingId is defined
                    .eq('user_id', user.id);

                if (error) console.error('Update error:', error);
            } else {
                // Create new entry logic
                const { error } = await supabase
                    .from('journals')
                    .insert([
                        { title: title.trim(), content, user_id: user.id },
                    ]);

                if (!error) clearDraft();
                if (error) console.error('Insert error:', error);
            }

            resetForm();
            refreshEntries();
            setIsSaving(false);
        },
        [
            user,
            editor,
            title,
            isEditing,
            editingId,
            isValid,
            getContent,
            resetForm,
            refreshEntries,
            clearDraft,
        ],
    );

    const filteredEntries = entries.filter((e) => {
        const q = searchQuery.toLowerCase();
        return (
            e.title.toLowerCase().includes(q) ||
            e.content
                .replace(/<[^>]+>/g, '')
                .toLowerCase()
                .includes(q)
        );
    });

    const wordCount = editor?.storage.characterCount.words() ?? 0;

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
                <JournalHeader entryCount={entries.length} />

                <JournalForm
                    editor={editor}
                    title={title}
                    onTitleChange={setTitle}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    focusMode={focusMode}
                    onFocusToggle={() => setFocusMode((v) => !v)}
                    onCancel={cancelEditing}
                    onSubmit={handleSubmit}
                    wordCount={wordCount}
                    autosaved={autosaved}
                />

                <section className="lg:col-span-8 space-y-6">
                    {/* View Toggle */}
                    <div className="flex gap-4 border-b border-stone-100 dark:border-zinc-800 pb-2">
                        <button
                            onClick={() => setView('all')}
                            className={`text-sm font-medium transition-colors ${view === 'all' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Recent
                        </button>
                        <button
                            onClick={() => setView('trash')}
                            className={`text-sm font-medium transition-colors ${view === 'trash' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Trash
                        </button>
                    </div>

                    {/* Search */}
                    {view === 'all' && (
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500">
                                ⌕
                            </span>
                            <input
                                type="search"
                                placeholder="Search entries…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>
                    )}

                    {/* Entry List */}
                    {filteredEntries.length === 0 ? (
                        <EmptyState
                            view={view}
                            hasSearchQuery={!!searchQuery}
                        />
                    ) : (
                        filteredEntries.map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onDelete={handleDelete}
                                onEdit={startEditing}
                                onRestore={handleRestore}
                                isTrash={view === 'trash'}
                            />
                        ))
                    )}
                </section>
            </main>
        </>
    );
}

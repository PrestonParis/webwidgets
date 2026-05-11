import { EditorContent } from '@tiptap/react';
import EditorToolbar from './EditorToolbar';
import { JournalFormProps } from '@/features/journal/types/journal';
import { useTranscription } from '@/features/journal/hooks/useTranscription';

export function JournalForm({
    editor,
    title,
    onTitleChange,
    isEditing,
    isSaving,
    focusMode,
    onFocusToggle,
    onCancel,
    onSubmit,
    wordCount,
    autosaved,
}: JournalFormProps) {
    const transcription = useTranscription(editor);

    return (
        <div
            className={`lg:col-span-8 transition-all duration-300 ${focusMode ? 'relative z-20' : ''}`}
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm sticky top-8 overflow-hidden">
                <form
                    onSubmit={(e) => {
                        void onSubmit(e);
                    }}
                    className="p-6 flex flex-col gap-4"
                >
                    <div className="flex items-center gap-2 border-b border-stone-200 dark:border-zinc-700 pb-2 focus-within:border-amber-500 transition-colors">
                        <input
                            type="text"
                            placeholder="Entry title…"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            className="flex-1 font-serif text-lg font-semibold bg-transparent border-0 outline-none text-stone-900 dark:text-zinc-100 placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                        />
                        {isEditing && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="text-xs text-stone-400 hover:text-red-400 transition-colors shrink-0"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onFocusToggle}
                            className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors shrink-0"
                        >
                            {focusMode ? '✕ Exit focus' : '⊡ Focus'}
                        </button>
                    </div>

                    <div className="border border-stone-200 dark:border-zinc-700 rounded-xl p-3 focus-within:border-amber-500 transition-colors min-h-95">
                        {editor ? ( // ← Check editor directly instead of isMounted
                            <>
                                <EditorToolbar
                                    editor={editor}
                                    transcription={transcription}
                                />
                                <EditorContent editor={editor} />
                            </>
                        ) : (
                            <div className="min-h-45 flex items-center justify-center text-stone-300 dark:text-zinc-600 text-sm">
                                Loading editor…
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-600">
                        <span>
                            {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        </span>
                        {transcription.isListening && transcription.interim ? (
                            <span className="italic text-stone-400 dark:text-zinc-500 max-w-[60%] truncate">
                                {transcription.interim}
                            </span>
                        ) : (
                            <span
                                className={`transition-opacity duration-500 ${autosaved ? 'opacity-100 text-emerald-500' : 'opacity-0'}`}
                            >
                                Draft saved
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-700 dark:hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-40 text-sm tracking-wide"
                    >
                        {isSaving
                            ? 'Saving…'
                            : isEditing
                              ? 'Update Entry'
                              : 'Save Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Archive, ChevronRight } from 'lucide-react';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import type { Document } from '@/features/documents/types/document';
import { cn } from '@/lib/utils/utils';

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function DocumentsPage({ initialId }: { initialId?: string }) {
    const { data: docs, isLoading, refresh } = useDocuments();
    const { createDocument, updateDocument, archiveDocument } =
        useDocumentMutations(refresh);

    const [selectedId, setSelectedId] = useState<string | null>(
        initialId ?? null,
    );
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const selected = docs.find((d) => d.id === selectedId) ?? null;

    useEffect(() => {
        if (selected) {
            setEditTitle(selected.title);
            setEditContent(selected.content);
            setDirty(false);
        }
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!initialId && docs.length > 0 && !selectedId) {
            const first = docs[0];
            if (first) setSelectedId(first.id);
        }
    }, [docs, selectedId, initialId]);

    const handleNew = async () => {
        try {
            const doc = (await createDocument({
                title: 'Untitled',
                content: '',
            })) as Document;
            if (doc?.id) setSelectedId(doc.id);
        } catch {
            // ignore
        }
    };

    const handleSave = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await updateDocument(selectedId, {
                title: editTitle,
                content: editContent,
            });
            setDirty(false);
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (id: string) => {
        await archiveDocument(id);
        if (selectedId === id) setSelectedId(null);
    };

    return (
        <div className="flex h-full min-h-[600px] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        Documents
                    </span>
                    <button
                        onClick={() => void handleNew()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#4f6ef7] text-white hover:bg-[#3d5ce5] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-1 p-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-zinc-400 text-sm">
                            No documents yet
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {docs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedId(doc.id)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                                        selectedId === doc.id
                                            ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]'
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
                                    )}
                                >
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">
                                            {doc.title}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                            {formatDate(doc.updatedAt)}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {selected ? (
                    <>
                        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <input
                                value={editTitle}
                                onChange={(e) => {
                                    setEditTitle(e.target.value);
                                    setDirty(true);
                                }}
                                className="flex-1 text-base font-semibold bg-transparent outline-none text-zinc-800 dark:text-zinc-100"
                                placeholder="Document title"
                            />
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() =>
                                        void handleArchive(selected.id)
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Archive"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => void handleSave()}
                                    disabled={!dirty || saving}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                        dirty
                                            ? 'bg-[#4f6ef7] text-white hover:bg-[#3d5ce5]'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400',
                                    )}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={editContent}
                            onChange={(e) => {
                                setEditContent(e.target.value);
                                setDirty(true);
                            }}
                            className="flex-1 p-6 resize-none bg-transparent outline-none text-sm text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed"
                            placeholder="Start writing..."
                        />
                        <div className="px-6 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
                            {editContent.length} chars · {selected.format} ·
                            Updated {formatDate(selected.updatedAt)}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">
                            Select a document or create a new one
                        </p>
                        <button
                            onClick={() => void handleNew()}
                            className="mt-3 px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm hover:bg-[#3d5ce5] transition-colors"
                        >
                            + New Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

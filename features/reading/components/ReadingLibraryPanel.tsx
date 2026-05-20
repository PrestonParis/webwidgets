'use client';

import { Search, BookOpen, FileText, Book } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReadingLibrary } from '@/features/reading/hooks/useReadingLibrary';
import type { ReadingDocument } from '@/features/reading/types/document';

const TYPE_ICON: Record<ReadingDocument['type'], LucideIcon> = {
    religious_text: BookOpen,
    pdf: FileText,
    epub: Book,
    web: FileText,
    provider_embed: BookOpen,
};

interface DocumentCardProps {
    doc: ReadingDocument;
    onSelect: (id: string) => void;
}

function DocumentCard({ doc, onSelect }: DocumentCardProps) {
    const Icon = TYPE_ICON[doc.type] ?? BookOpen;
    return (
        <button
            onClick={() => onSelect(doc.id)}
            className="flex items-start gap-3 w-full p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors border border-gray-100 dark:border-zinc-800"
        >
            <Icon size={18} className="text-[#4f6ef7] mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {doc.title}
                </p>
                {doc.author && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {doc.author}
                    </p>
                )}
                {doc.description && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-2">
                        {doc.description}
                    </p>
                )}
            </div>
        </button>
    );
}

interface ReadingLibraryPanelProps {
    onSelect: (documentId: string) => void;
}

export function ReadingLibraryPanel({ onSelect }: ReadingLibraryPanelProps) {
    const { documents, loading, error, search, setSearch } =
        useReadingLibrary();

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
                    Reading Library
                </h2>
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                        type="text"
                        placeholder="Search documents…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="w-4 h-4 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
                {!loading &&
                    documents.map((doc) => (
                        <DocumentCard
                            key={doc.id}
                            doc={doc}
                            onSelect={onSelect}
                        />
                    ))}
                {!loading && documents.length === 0 && !error && (
                    <p className="text-xs text-zinc-400 text-center py-8">
                        No documents found.
                    </p>
                )}
            </div>
        </div>
    );
}

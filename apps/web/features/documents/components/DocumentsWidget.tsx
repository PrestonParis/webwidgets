'use client';

import { FileText } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useRouter } from 'next/navigation';

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

const FORMAT_LABELS: Record<string, string> = {
    markdown: 'MD',
    plain_text: 'TXT',
    rich_text: 'RTF',
    json: 'JSON',
};

export default function DocumentsWidget() {
    const { data: docs, isLoading, refresh } = useDocuments();
    const { createDocument } = useDocumentMutations(refresh);
    const router = useRouter();

    const recent = docs.slice(0, 5);

    const handleNew = async () => {
        try {
            const newDoc = (await createDocument({
                title: 'Untitled',
                content: '',
            })) as {
                id: string;
            };
            if (newDoc?.id) {
                router.push(`/documents/${newDoc.id}`);
            }
        } catch {
            // ignore
        }
    };

    return (
        <WidgetShell
            icon={<FileText />}
            title="Documents"
            badge={`${docs.length} doc${docs.length !== 1 ? 's' : ''}`}
            widgetId="documents"
            widgetType="documents"
            footerHref="/documents"
            footerLabel="View all documents"
        >
            {isLoading ? (
                <div className="space-y-2 mt-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">
                        No documents yet
                    </p>
                    <button
                        onClick={() => void handleNew()}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#4f6ef7] text-white hover:bg-[#3d5ce5] transition-colors"
                    >
                        + New Document
                    </button>
                </div>
            ) : (
                <div className="space-y-1 mt-2">
                    {recent.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => router.push(`/documents/${doc.id}`)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/item"
                        >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                            <span className="flex-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                {doc.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                {FORMAT_LABELS[doc.format] ?? doc.format}
                            </span>
                            <span className="shrink-0 text-[10px] text-zinc-400">
                                {formatDate(doc.updatedAt)}
                            </span>
                        </button>
                    ))}
                    <button
                        onClick={() => void handleNew()}
                        className="w-full mt-1 text-[11px] text-[#4f6ef7] hover:underline text-left px-2 py-1"
                    >
                        + New document
                    </button>
                </div>
            )}
        </WidgetShell>
    );
}

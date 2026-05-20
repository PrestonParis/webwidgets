'use client';

import { File, Image, Table, Code2, FileText } from 'lucide-react';
import type { ViewFileRef } from '@/features/view/schemas/viewSchemas';
import { useViewFiles } from '@/features/view/hooks/useViewFiles';

function iconFor(mimeType: string) {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'text/csv') return Table;
    if (mimeType.includes('javascript') || mimeType.startsWith('text/'))
        return Code2;
    if (mimeType === 'application/pdf') return FileText;
    return File;
}

export function ViewFileBrowser({
    activeFileId,
    onSelect,
}: {
    activeFileId?: string;
    onSelect: (file: ViewFileRef) => void;
}) {
    const { data: files = [], isLoading, isError } = useViewFiles();
    return (
        <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Files
                </p>
            </div>
            <div className="h-full overflow-y-auto p-2">
                {isLoading && (
                    <p className="p-3 text-xs text-zinc-500">
                        Loading files...
                    </p>
                )}
                {isError && (
                    <p className="p-3 text-xs text-red-400">
                        Could not load files.
                    </p>
                )}
                {files.map((file) => {
                    const Icon = iconFor(file.mimeType);
                    return (
                        <button
                            key={file.id}
                            onClick={() => onSelect(file)}
                            className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition ${activeFileId === file.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                                {file.name}
                            </span>
                        </button>
                    );
                })}
                {!isLoading && files.length === 0 && (
                    <p className="p-3 text-xs text-zinc-500">
                        No uploaded files yet.
                    </p>
                )}
            </div>
        </aside>
    );
}

'use client';

import { File } from 'lucide-react';
import type {
    ViewFile,
    ViewLayout,
    ViewSortField,
    ViewSortDir,
} from '@/features/view/types/viewFile';
import { getFileIcon } from '@/features/view/lib/fileIcons';
import { formatFileSize } from '@/features/view/lib/formatFileSize';
import { getMimeCategory } from '@/features/view/lib/fileMimeCategory';

interface ViewFileGridProps {
    files: ViewFile[];
    layout: ViewLayout;
    sortField: ViewSortField;
    sortDir: ViewSortDir;
    search: string;
    mimeCategory: string | null;
    selectedFileId: string | null;
    onSelect: (file: ViewFile) => void;
    onOpen: (file: ViewFile) => void;
}

function sortFiles(
    files: ViewFile[],
    field: ViewSortField,
    dir: ViewSortDir,
): ViewFile[] {
    const sorted = [...files].sort((a, b) => {
        let cmp = 0;
        switch (field) {
            case 'name':
                cmp = a.name.localeCompare(b.name);
                break;
            case 'size':
                cmp = a.sizeBytes - b.sizeBytes;
                break;
            case 'type':
                cmp = a.mimeType.localeCompare(b.mimeType);
                break;
            case 'uploadedAt':
                cmp = a.uploadedAt.localeCompare(b.uploadedAt);
                break;
            case 'updatedAt':
                cmp = a.updatedAt.localeCompare(b.updatedAt);
                break;
        }
        return dir === 'asc' ? cmp : -cmp;
    });
    return sorted;
}

function filterFiles(
    files: ViewFile[],
    search: string,
    mimeCategory: string | null,
): ViewFile[] {
    let result = files;
    if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(
            (f) =>
                f.name.toLowerCase().includes(q) ||
                f.mimeType.toLowerCase().includes(q) ||
                f.extension.toLowerCase().includes(q),
        );
    }
    if (mimeCategory) {
        result = result.filter(
            (f) => getMimeCategory(f.mimeType) === mimeCategory,
        );
    }
    return result;
}

function formatDate(iso: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export function ViewFileGrid({
    files,
    layout,
    sortField,
    sortDir,
    search,
    mimeCategory,
    selectedFileId,
    onSelect,
    onOpen,
}: ViewFileGridProps) {
    const filtered = filterFiles(files, search, mimeCategory);
    const sorted = sortFiles(filtered, sortField, sortDir);

    if (sorted.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <File size={32} className="text-zinc-700" />
                <p className="text-sm text-zinc-500">
                    {search || mimeCategory
                        ? 'No files match your filters.'
                        : 'No files yet.'}
                </p>
            </div>
        );
    }

    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                {sorted.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    const isSelected = file.id === selectedFileId;
                    return (
                        <button
                            key={file.id}
                            onClick={() => onSelect(file)}
                            onDoubleClick={() => onOpen(file)}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-950/40 shadow-md' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'}`}
                        >
                            <Icon
                                size={36}
                                className={
                                    isSelected
                                        ? 'text-indigo-400'
                                        : 'text-zinc-400'
                                }
                            />
                            <div className="w-full">
                                <p className="truncate text-xs font-medium text-zinc-200">
                                    {file.name}
                                </p>
                                <p className="mt-0.5 text-[10px] text-zinc-600">
                                    {formatFileSize(file.sizeBytes)}
                                </p>
                                <p className="text-[10px] text-zinc-700">
                                    {formatDate(file.uploadedAt)}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    // List view
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-zinc-800 text-left">
                        <th className="px-4 py-2 text-xs font-semibold text-zinc-500">
                            Name
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold text-zinc-500">
                            Type
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold text-zinc-500">
                            Size
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold text-zinc-500">
                            Uploaded
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold text-zinc-500">
                            Source
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        const isSelected = file.id === selectedFileId;
                        return (
                            <tr
                                key={file.id}
                                onClick={() => onSelect(file)}
                                onDoubleClick={() => onOpen(file)}
                                className={`cursor-pointer border-b border-zinc-800/50 transition-colors ${isSelected ? 'bg-indigo-950/30' : 'hover:bg-zinc-900/60'}`}
                            >
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            size={15}
                                            className="shrink-0 text-zinc-400"
                                        />
                                        <span className="max-w-[200px] truncate font-medium text-zinc-200">
                                            {file.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-xs text-zinc-500 uppercase">
                                    {file.extension || '—'}
                                </td>
                                <td className="px-4 py-2 text-xs text-zinc-500 tabular-nums">
                                    {formatFileSize(file.sizeBytes)}
                                </td>
                                <td className="px-4 py-2 text-xs text-zinc-500">
                                    {formatDate(file.uploadedAt)}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                                        {file.sourceLabel}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

'use client';

import { useRef } from 'react';
import {
    Search,
    LayoutGrid,
    List,
    Upload,
    SlidersHorizontal,
    ChevronDown,
} from 'lucide-react';
import type {
    ViewLayout,
    ViewSortField,
    ViewSortDir,
} from '@/features/view/types/viewFile';

interface ViewToolbarProps {
    search: string;
    onSearchChange: (s: string) => void;
    layout: ViewLayout;
    onLayoutChange: (l: ViewLayout) => void;
    sortField: ViewSortField;
    sortDir: ViewSortDir;
    onSortChange: (field: ViewSortField, dir: ViewSortDir) => void;
    mimeCategory: string | null;
    onMimeCategoryChange: (cat: string | null) => void;
    detailsOpen: boolean;
    onToggleDetails: () => void;
    onUploadClick: () => void;
}

const SORT_OPTIONS: { field: ViewSortField; label: string }[] = [
    { field: 'name', label: 'Name' },
    { field: 'size', label: 'Size' },
    { field: 'type', label: 'Type' },
    { field: 'uploadedAt', label: 'Date uploaded' },
    { field: 'updatedAt', label: 'Date modified' },
];

const MIME_FILTERS: { value: string; label: string }[] = [
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents' },
    { value: 'code', label: 'Code' },
    { value: 'data', label: 'Data' },
    { value: 'archive', label: 'Archives' },
];

export function ViewToolbar({
    search,
    onSearchChange,
    layout,
    onLayoutChange,
    sortField,
    sortDir,
    onSortChange,
    mimeCategory,
    onMimeCategoryChange,
    detailsOpen,
    onToggleDetails,
    onUploadClick,
}: ViewToolbarProps) {
    const sortSelectRef = useRef<HTMLSelectElement>(null);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [field, dir] = e.target.value.split(':') as [
            ViewSortField,
            ViewSortDir,
        ];
        onSortChange(field, dir);
    };

    const sortValue = `${sortField}:${sortDir}`;

    return (
        <div className="flex flex-col gap-2 border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search files…"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                {/* Layout toggle */}
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900">
                    <button
                        onClick={() => onLayoutChange('grid')}
                        title="Grid view"
                        className={`rounded-l-md p-1.5 transition-colors ${layout === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <LayoutGrid size={15} />
                    </button>
                    <button
                        onClick={() => onLayoutChange('list')}
                        title="List view"
                        className={`rounded-r-md p-1.5 transition-colors ${layout === 'list' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <List size={15} />
                    </button>
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        ref={sortSelectRef}
                        value={sortValue}
                        onChange={handleSortChange}
                        className="appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-3 pr-7 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
                    >
                        {SORT_OPTIONS.map(({ field, label }) => (
                            <optgroup key={field} label={label}>
                                <option value={`${field}:asc`}>
                                    {label} ↑
                                </option>
                                <option value={`${field}:desc`}>
                                    {label} ↓
                                </option>
                            </optgroup>
                        ))}
                    </select>
                    <ChevronDown
                        size={12}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                </div>

                {/* Details toggle */}
                <button
                    onClick={onToggleDetails}
                    title="Toggle details pane"
                    className={`rounded-lg border p-1.5 transition-colors ${detailsOpen ? 'border-indigo-600 bg-indigo-950/50 text-indigo-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                >
                    <SlidersHorizontal size={15} />
                </button>

                {/* Upload */}
                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    <Upload size={14} />
                    Upload
                </button>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                    onClick={() => onMimeCategoryChange(null)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${mimeCategory === null ? 'bg-indigo-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'}`}
                >
                    All types
                </button>
                {MIME_FILTERS.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() =>
                            onMimeCategoryChange(
                                mimeCategory === value ? null : value,
                            )
                        }
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${mimeCategory === value ? 'bg-indigo-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

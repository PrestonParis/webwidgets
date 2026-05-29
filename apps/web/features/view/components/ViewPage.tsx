'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useViewFiles } from '@/features/view/hooks/useViewFiles';
import { useViewStore } from '@/features/view/state/viewStore';
import { viewFileToRef } from '@/features/view/providers/uploadViewProvider';
import { ViewSidebar } from '@/features/view/components/ViewSidebar';
import { ViewToolbar } from '@/features/view/components/ViewToolbar';
import { ViewFileGrid } from '@/features/view/components/ViewFileGrid';
import { ViewDetailsPane } from '@/features/view/components/ViewDetailsPane';
import { ViewUploadZone } from '@/features/view/components/ViewUploadZone';
import type {
    ViewFile,
    ViewFolder,
    ViewLayout,
    ViewSortField,
    ViewSortDir,
} from '@/features/view/types/viewFile';

async function fetchFolders(): Promise<ViewFolder[]> {
    const res = await fetch('/api/uploads/folders');
    if (!res.ok) return [];
    const data = (await res.json()) as { folders?: ViewFolder[] };
    return data.folders ?? [];
}

export function ViewPage() {
    const queryClient = useQueryClient();
    const { data: files = [], isLoading, isError, refetch } = useViewFiles();
    const { data: folders = [] } = useQuery({
        queryKey: ['view-folders'],
        queryFn: fetchFolders,
        staleTime: 120_000,
    });

    const setActiveFile = useViewStore((s) => s.setActiveFile);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // Layout state
    const [layout, setLayout] = useState<ViewLayout>('grid');
    const [sortField, setSortField] = useState<ViewSortField>('uploadedAt');
    const [sortDir, setSortDir] = useState<ViewSortDir>('desc');
    const [section, setSection] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [mimeCategory, setMimeCategory] = useState<string | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

    const handleSortChange = (field: ViewSortField, dir: ViewSortDir) => {
        setSortField(field);
        setSortDir(dir);
    };

    const handleSelect = (file: ViewFile) => {
        setSelectedFileId(file.id);
        setDetailsOpen(true);
    };

    const handleOpen = (file: ViewFile) => {
        // Wire to viewStore so ViewWorkspace picks it up
        setActiveFile(viewFileToRef(file));
    };

    const handleCreateFolder = async (name: string) => {
        await fetch('/api/uploads/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        await queryClient.invalidateQueries({ queryKey: ['view-folders'] });
    };

    // Section-based filtering
    const sectionFiltered = (() => {
        if (section === 'all') return files;
        if (section === 'recent') {
            const cutoff = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString();
            return files.filter((f) => f.uploadedAt >= cutoff);
        }
        if (section === 'favorites') return files.filter((f) => f.favorite);
        // folderId
        return files.filter((f) => f.folderId === section);
    })();

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
            {/* Sidebar */}
            <ViewSidebar
                folders={folders}
                activeSection={section}
                onSectionChange={setSection}
                onCreateFolder={(name) => void handleCreateFolder(name)}
            />

            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col">
                <ViewToolbar
                    search={search}
                    onSearchChange={setSearch}
                    layout={layout}
                    onLayoutChange={setLayout}
                    sortField={sortField}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                    mimeCategory={mimeCategory}
                    onMimeCategoryChange={setMimeCategory}
                    detailsOpen={detailsOpen}
                    onToggleDetails={() => setDetailsOpen((v) => !v)}
                    onUploadClick={() => uploadInputRef.current?.click()}
                />

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="space-y-2 p-4">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-12 animate-pulse rounded-lg bg-zinc-800/50"
                                />
                            ))}
                        </div>
                    )}
                    {isError && (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <p className="text-sm text-red-400">
                                Could not load files.
                            </p>
                            <button
                                onClick={() => void refetch()}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!isLoading && !isError && (
                        <ViewUploadZone className="min-h-full">
                            {sectionFiltered.length === 0 &&
                            search === '' &&
                            mimeCategory === null ? (
                                <ViewUploadZone standalone className="m-8" />
                            ) : (
                                <ViewFileGrid
                                    files={sectionFiltered}
                                    layout={layout}
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    search={search}
                                    mimeCategory={mimeCategory}
                                    selectedFileId={selectedFileId}
                                    onSelect={handleSelect}
                                    onOpen={handleOpen}
                                />
                            )}
                        </ViewUploadZone>
                    )}
                </div>
            </div>

            {/* Details pane */}
            {detailsOpen && selectedFile && (
                <ViewDetailsPane
                    file={selectedFile}
                    onClose={() => setDetailsOpen(false)}
                    onOpen={handleOpen}
                    onDeleted={() => {
                        setSelectedFileId(null);
                        setDetailsOpen(false);
                    }}
                />
            )}

            {/* Hidden upload input (triggered by toolbar) */}
            <input
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    // The ViewUploadZone wrapper handles actual upload; this input is for the toolbar button.
                    // Re-use the same zone by dispatching a synthetic drop or just trigger a simpler upload.
                    // For simplicity: directly upload via the uploadApi here.
                    if (!e.target.files || e.target.files.length === 0) return;
                    void (async () => {
                        const { requestPresignedUrl, uploadFileContent } =
                            await import('@/features/uploads/api/uploadApi');
                        const files = Array.from(e.target.files!);
                        await Promise.allSettled(
                            files.map(async (file) => {
                                const { fileId } = await requestPresignedUrl(
                                    file.name,
                                    file.type || 'application/octet-stream',
                                    file.size,
                                );
                                await uploadFileContent(fileId, file);
                            }),
                        );
                        await queryClient.invalidateQueries({
                            queryKey: ['view-files'],
                        });
                    })();
                    e.target.value = '';
                }}
            />
        </div>
    );
}

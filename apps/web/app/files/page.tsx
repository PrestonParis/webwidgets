'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Cloud, FolderOpen, HardDrive, Sparkles, X } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { LoadingState } from '@/features/ui/loading';
import { FileUploadZone } from '@/features/uploads/components/FileUploadZone';
import { FileList } from '@/features/uploads/components/FileList';
import { useFileUpload } from '@/features/uploads/hooks/useFileUpload';
import {
    uploadToViewFile,
    uploadToViewFileFull,
} from '@/features/view/providers/uploadViewProvider';
import { viewFileToRef } from '@/features/view/providers/uploadViewProvider';
import { useViewStore } from '@/features/view/state/viewStore';
import { ViewWorkspace } from '@/features/view/components/ViewWorkspace';
import { ViewDetailsPane } from '@/features/view/components/ViewDetailsPane';
import type { FileUpload } from '@/features/uploads/types/upload';
import { cn } from '@/lib/utils/utils';

const DriveFileBrowser = dynamic(
    () =>
        import('@/features/uploads/components/DriveFileBrowser').then(
            (module) => module.DriveFileBrowser,
        ),
    { loading: () => <LoadingState variant="section" minHeight="min-h-40" /> },
);

const OneDriveFileBrowser = dynamic(
    () =>
        import('@/features/uploads/components/OneDriveFileBrowser').then(
            (module) => module.OneDriveFileBrowser,
        ),
    { loading: () => <LoadingState variant="section" minHeight="min-h-40" /> },
);

const ArtifactsPage = dynamic(
    () => import('@/features/artifacts/components/ArtifactsPage'),
    { loading: () => <LoadingState variant="section" minHeight="min-h-40" /> },
);

type Tab = 'my-files' | 'drive' | 'onedrive' | 'artifacts';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'my-files', label: 'My Files', icon: <FolderOpen size={14} /> },
    { id: 'drive', label: 'Google Drive', icon: <HardDrive size={14} /> },
    { id: 'onedrive', label: 'OneDrive', icon: <Cloud size={14} /> },
    { id: 'artifacts', label: 'Artifacts', icon: <Sparkles size={14} /> },
];

export default function FilesPage() {
    const { files, tasks, loading, upload, retry, remove, reload } =
        useFileUpload();
    const [tab, setTab] = useState<Tab>('my-files');
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
    const setActiveFile = useViewStore((state) => state.setActiveFile);

    useEffect(
        () => () => {
            setActiveFile(null);
        },
        [setActiveFile],
    );

    const openFile = (file: FileUpload) => {
        setSelectedFile(file);
        setActiveFile(uploadToViewFile(file));
    };

    const closeFile = () => {
        setSelectedFile(null);
        setActiveFile(null);
    };

    return (
        <>
            <Header />
            <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        Files
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Upload and manage documents, images, and generated
                        artifacts.
                    </p>
                </div>

                <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                    {TABS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                tab === item.id
                                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400',
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'my-files' ? (
                    <div className="space-y-4">
                        <FileUploadZone
                            compact={files.length > 0}
                            tasks={tasks}
                            onUpload={upload}
                            onRetry={retry}
                        />
                        {loading ? (
                            <LoadingState
                                variant="section"
                                minHeight="min-h-40"
                            />
                        ) : (
                            <FileList
                                files={files}
                                tasks={tasks}
                                search={search}
                                onSearch={setSearch}
                                onOpen={openFile}
                                onRemove={async (fileId) => {
                                    await remove(fileId);
                                    if (selectedFile?.id === fileId)
                                        closeFile();
                                }}
                            />
                        )}
                    </div>
                ) : tab === 'drive' ? (
                    <DriveFileBrowser />
                ) : tab === 'onedrive' ? (
                    <OneDriveFileBrowser />
                ) : (
                    <ArtifactsPage />
                )}
            </main>
            <Footer />

            {selectedFile && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
                    <button
                        type="button"
                        aria-label="Close file preview"
                        className="absolute inset-0 cursor-default"
                        onClick={closeFile}
                    />
                    <aside className="relative flex h-full w-full flex-col bg-zinc-950 shadow-2xl md:w-[72vw] md:max-w-5xl">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-zinc-100">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {selectedFile.originalName}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {selectedFile.mimeType} ·{' '}
                                    {new Date(
                                        selectedFile.createdAt,
                                    ).toLocaleString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFile}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                aria-label="Close file preview"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex min-h-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <ViewWorkspace compact />
                            </div>
                            <div className="hidden lg:block">
                                <ViewDetailsPane
                                    file={uploadToViewFileFull(selectedFile)}
                                    onClose={closeFile}
                                    onOpen={(file) =>
                                        setActiveFile(viewFileToRef(file))
                                    }
                                    onDeleted={() => {
                                        closeFile();
                                        void reload();
                                    }}
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

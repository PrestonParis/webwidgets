'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { FolderOpen, HardDrive, Sparkles } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { LoadingState } from '@/features/ui/loading';
import { FileUploadZone } from '@/features/uploads/components/FileUploadZone';
import { FileList } from '@/features/uploads/components/FileList';
import { FileAiActionFlow } from '@/features/uploads/components/FileAiActionFlow';
import { useFileUpload } from '@/features/uploads/hooks/useFileUpload';
import { cn } from '@/lib/utils/utils';

const DriveFileBrowser = dynamic(
    () =>
        import('@/features/uploads/components/DriveFileBrowser').then(
            (module) => module.DriveFileBrowser,
        ),
    { loading: () => <LoadingState variant="section" minHeight="min-h-40" /> },
);

const ArtifactsPage = dynamic(
    () => import('@/features/artifacts/components/ArtifactsPage'),
    { loading: () => <LoadingState variant="section" minHeight="min-h-40" /> },
);

type Tab = 'my-files' | 'drive' | 'artifacts';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'my-files', label: 'My Files', icon: <FolderOpen size={14} /> },
    { id: 'drive', label: 'Google Drive', icon: <HardDrive size={14} /> },
    { id: 'artifacts', label: 'Artifacts', icon: <Sparkles size={14} /> },
];

export default function FilesPage() {
    const {
        files,
        uploadState,
        uploadProgress,
        uploadError,
        loading,
        upload,
        remove,
    } = useFileUpload();
    const [tab, setTab] = useState<Tab>('my-files');

    const isWide = tab === 'artifacts' || tab === 'my-files';

    return (
        <>
            <Header />
            <div
                className={cn(
                    'mx-auto px-6 py-10 space-y-6',
                    isWide ? 'max-w-5xl' : 'max-w-2xl',
                )}
            >
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        Files
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Upload files, browse your Google Drive, or view
                        AI-generated artifacts.
                    </p>
                </div>

                <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                tab === t.id
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                            )}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'my-files' ? (
                    <div className="space-y-6">
                        <FileUploadZone
                            uploadState={uploadState}
                            uploadProgress={uploadProgress}
                            uploadError={uploadError}
                            onUpload={upload}
                        />
                        <FileAiActionFlow
                            files={files}
                            onOpenArtifacts={() => setTab('artifacts')}
                        />
                        {loading ? (
                            <LoadingState
                                variant="section"
                                minHeight="min-h-40"
                            />
                        ) : (
                            <FileList files={files} onRemove={remove} />
                        )}
                    </div>
                ) : tab === 'drive' ? (
                    <DriveFileBrowser />
                ) : (
                    <ArtifactsPage />
                )}
            </div>
            <Footer />
        </>
    );
}

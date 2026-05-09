'use client';

import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Header from '@/features/ui/components/Header';
import DashboardGrid from './DashboardGrid';
import HiddenWidgetsTray from './HiddenWidgetsTray';
import FolderSubScreen from './FolderSubScreen';
import { useDashboardLayout } from '@/features/dashboard/hooks/useDashboardLayout';
import Footer from '@/features/ui/components/Footer';
import { useGreeting } from '@/features/dashboard/hooks/useGreeting';
import { useTrackers } from '@/features/dashboard/hooks/useTrackers';
import { useFolderActions } from '@/features/dashboard/hooks/useFolderActions';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';

function DashboardHeader({
    greeting,
    firstName,
    folderAdded,
    onAddFolder,
}: {
    greeting: string | null;
    firstName: string | null;
    folderAdded: boolean;
    onAddFolder: () => void;
}) {
    return (
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                    Command Center
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    {greeting || `Welcome back, ${firstName}.`}
                </p>
            </div>
            <div className="flex items-center gap-3">
                {folderAdded && (
                    <span className="text-sm font-medium text-emerald-500 animate-fade-in">
                        Folder added
                    </span>
                )}
                <button
                    onClick={onAddFolder}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                >
                    <FolderPlus size={16} />
                    Add Folder
                </button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { firstName } = useAuth();
    const { trackers, handleReset } = useTrackers();
    const { layout, updateLayout, toggleVisibility, ready } =
        useDashboardLayout(trackers);
    const greeting = useGreeting(firstName);
    const {
        activeFolderId,
        setActiveFolderId,
        addFolder,
        renameFolder,
        deleteFolder,
        removeFromFolder,
    } = useFolderActions(layout, updateLayout);

    const [folderAdded, setFolderAdded] = useState(false);

    function handleAddFolder() {
        addFolder();
        setFolderAdded(true);
        setTimeout(() => setFolderAdded(false), 2500);
    }

    const activeFolder = activeFolderId
        ? ((layout as WidgetConfig[]).find((w) => w.id === activeFolderId) ??
          null)
        : null;
    const hiddenWidgets = layout.filter(
        (w) => !w.visible && w.containerId === 'main',
    );

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
                <main className="max-w-7xl mx-auto p-6 lg:p-12">
                    {activeFolder ? (
                        ready && (
                            <FolderSubScreen
                                folder={activeFolder}
                                layout={layout}
                                onBack={() => setActiveFolderId(null)}
                                onLayoutChange={updateLayout}
                                onRemoveFromFolder={removeFromFolder}
                                onToggleVisible={toggleVisibility}
                                onReset={(id, newStart) => {
                                    void handleReset(id, newStart);
                                }}
                            />
                        )
                    ) : (
                        <>
                            <DashboardHeader
                                greeting={greeting}
                                firstName={firstName}
                                folderAdded={folderAdded}
                                onAddFolder={handleAddFolder}
                            />
                            {ready ? (
                                <DashboardGrid
                                    layout={layout}
                                    onLayoutChange={updateLayout}
                                    onToggleVisible={toggleVisibility}
                                    onReset={(id, newStart) => {
                                        void handleReset(id, newStart);
                                    }}
                                    onOpenFolder={setActiveFolderId}
                                    onRenameFolder={renameFolder}
                                    onDeleteFolder={deleteFolder}
                                />
                            ) : (
                                <div className="flex justify-center py-24">
                                    <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {hiddenWidgets.length > 0 && (
                                <HiddenWidgetsTray
                                    hidden={hiddenWidgets}
                                    onRestore={toggleVisibility}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </>
    );
}

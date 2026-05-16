'use client';

import { FolderPlus, ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { useBackground } from '@/features/settings/hooks/useBackground';
import { BackgroundPickerPanel } from '@/features/settings/components/BackgroundPickerPanel';

// ─── background popover ───────────────────────────────────────────────────────

function BackgroundPopover() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                    open
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                }`}
            >
                <ImageIcon size={16} />
                Background
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-4">
                    <BackgroundPickerPanel compact />
                </div>
            )}
        </div>
    );
}

// ─── dashboard header ─────────────────────────────────────────────────────────

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
                <BackgroundPopover />
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

// ─── page ─────────────────────────────────────────────────────────────────────

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
    const { style: bgStyle, isDefault } = useBackground();

    function handleAddFolder() {
        addFolder();
        setFolderAdded(true);
        setTimeout(() => setFolderAdded(false), 2500);
    }

    const activeFolder = activeFolderId
        ? (layout.find((w) => w.id === activeFolderId) ?? null)
        : null;
    const hiddenWidgets = layout.filter(
        (w) => !w.visible && w.containerId === 'main',
    );

    return (
        <>
            <Header />
            <div
                className={`min-h-screen transition-colors duration-300 ${isDefault ? 'bg-gray-50 dark:bg-zinc-950' : ''}`}
                style={isDefault ? undefined : bgStyle}
            >
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

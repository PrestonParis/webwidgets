'use client';

import { useState } from 'react';
import { FolderPlus, Star, Clock, Files, FolderOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ViewFolder } from '@/features/view/types/viewFile';

interface ViewSidebarProps {
    folders: ViewFolder[];
    activeSection: 'all' | 'recent' | 'favorites' | (string & {}); // string = folderId
    onSectionChange: (section: string) => void;
    onCreateFolder: (name: string) => void;
}

export function ViewSidebar({
    folders,
    activeSection,
    onSectionChange,
    onCreateFolder,
}: ViewSidebarProps) {
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreateFolder = () => {
        const name = newFolderName.trim();
        if (!name) return;
        onCreateFolder(name);
        setNewFolderName('');
        setCreatingFolder(false);
    };

    const navItem = (id: string, label: string, Icon: LucideIcon) => (
        <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${activeSection === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'}`}
        >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1 truncate">{label}</span>
        </button>
    );

    return (
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80">
            {/* Locations */}
            <div className="px-3 pt-4 pb-2">
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    Locations
                </p>
                <nav className="flex flex-col gap-0.5">
                    {navItem('all', 'All Files', Files)}
                    {navItem('recent', 'Recent', Clock)}
                    {navItem('favorites', 'Favorites', Star)}
                </nav>
            </div>

            {/* Folders */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="mb-1.5 flex items-center justify-between px-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                        Folders
                    </p>
                    <button
                        onClick={() => setCreatingFolder(true)}
                        title="New folder"
                        className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                    >
                        <FolderPlus size={12} />
                    </button>
                </div>

                {creatingFolder && (
                    <div className="mb-1 flex items-center gap-1 px-1">
                        <input
                            autoFocus
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') {
                                    setCreatingFolder(false);
                                    setNewFolderName('');
                                }
                            }}
                            placeholder="Folder name"
                            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                            onClick={handleCreateFolder}
                            className="rounded bg-indigo-600 px-1.5 py-1 text-xs text-white hover:bg-indigo-500"
                        >
                            Add
                        </button>
                    </div>
                )}

                {folders.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-zinc-600">
                        No folders
                    </p>
                ) : (
                    <nav className="flex flex-col gap-0.5">
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => onSectionChange(folder.id)}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${activeSection === folder.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'}`}
                            >
                                <FolderOpen size={14} className="shrink-0" />
                                <span className="flex-1 truncate text-sm">
                                    {folder.name}
                                </span>
                            </button>
                        ))}
                    </nav>
                )}
            </div>
        </aside>
    );
}

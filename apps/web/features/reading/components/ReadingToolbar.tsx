'use client';

import {
    Search,
    Bookmark,
    StickyNote,
    Highlighter,
    BookOpen,
    Settings2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { ReadingVersionSelector } from './ReadingVersionSelector';
import { ReadingNavigation } from './ReadingNavigation';
import type {
    ReadingVersion,
    ReadingStructure,
} from '@/features/reading/types/document';
import type { ReadingPosition } from '@/features/reading/types/positions';

export type ReadingPanel =
    | 'search'
    | 'bookmarks'
    | 'notes'
    | 'highlights'
    | 'plan'
    | 'settings'
    | null;

interface ReadingToolbarProps {
    title: string;
    versions: ReadingVersion[];
    activeVersionId: string | undefined;
    structure: ReadingStructure | null;
    position: ReadingPosition | null;
    activePanel: ReadingPanel;
    onVersionChange: (id: string) => void;
    onNavigate: (delta: -1 | 1) => void;
    onJump?: (pos: ReadingPosition) => void;
    onPanelToggle: (panel: ReadingPanel) => void;
    onClose: () => void;
}

function ToolbarButton({
    icon: Icon,
    label,
    active,
    onClick,
}: {
    icon: import('lucide-react').LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                'p-1.5 rounded-lg transition-colors',
                active
                    ? 'bg-[#4f6ef7] text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
        >
            <Icon size={14} />
        </button>
    );
}

export function ReadingToolbar({
    title,
    versions,
    activeVersionId,
    structure,
    position,
    activePanel,
    onVersionChange,
    onNavigate,
    onJump,
    onPanelToggle,
    onClose,
}: ReadingToolbarProps) {
    function toggle(panel: Exclude<ReadingPanel, null>) {
        onPanelToggle(activePanel === panel ? null : panel);
    }

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2 min-w-0">
                <BookOpen size={14} className="text-[#4f6ef7] shrink-0" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    {title}
                </span>
            </div>
            <ReadingNavigation
                structure={structure}
                position={position}
                onNavigate={onNavigate}
                {...(onJump && { onJump })}
            />
            <div className="flex items-center gap-1">
                <ReadingVersionSelector
                    versions={versions}
                    activeVersionId={activeVersionId}
                    onSelect={onVersionChange}
                />
                <ToolbarButton
                    icon={Search}
                    label="Search"
                    active={activePanel === 'search'}
                    onClick={() => toggle('search')}
                />
                <ToolbarButton
                    icon={Bookmark}
                    label="Bookmarks"
                    active={activePanel === 'bookmarks'}
                    onClick={() => toggle('bookmarks')}
                />
                <ToolbarButton
                    icon={Highlighter}
                    label="Highlights"
                    active={activePanel === 'highlights'}
                    onClick={() => toggle('highlights')}
                />
                <ToolbarButton
                    icon={StickyNote}
                    label="Notes"
                    active={activePanel === 'notes'}
                    onClick={() => toggle('notes')}
                />
                <ToolbarButton
                    icon={Settings2}
                    label="Preferences"
                    active={activePanel === 'settings'}
                    onClick={() => toggle('settings')}
                />
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Close document"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

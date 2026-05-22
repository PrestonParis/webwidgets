'use client';

import { useState } from 'react';
import type { Tab } from '@/features/chess/types/chess';
import type { ChessGame } from '@/features/chess/types/chess';

interface GameHeaderProps {
    game: ChessGame;
    tab: Tab;
    onBack: () => void;
    onTabChange: (t: Tab) => void;
    onTitleChange?: (title: string) => void;
}

export function GameHeader({
    game,
    tab,
    onBack,
    onTabChange,
    onTitleChange,
}: GameHeaderProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const displayTitle = game.title ?? game.event ?? 'Casual Game';

    const startEdit = () => {
        setDraft(game.title ?? game.event ?? '');
        setEditing(true);
    };

    const commitEdit = () => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed !== displayTitle) {
            onTitleChange?.(trimmed);
        }
    };

    return (
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                    ← Library
                </button>
                <div>
                    {editing ? (
                        <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') setEditing(false);
                            }}
                            className="bg-zinc-800 text-zinc-100 rounded px-2 py-0.5 text-sm font-semibold outline-none border border-zinc-600 focus:border-blue-500 w-64"
                        />
                    ) : (
                        <button
                            onClick={onTitleChange ? startEdit : undefined}
                            className={`font-semibold text-zinc-100 text-left ${onTitleChange ? 'hover:text-blue-400 cursor-pointer' : 'cursor-default'} transition-colors`}
                            title={
                                onTitleChange ? 'Click to rename' : undefined
                            }
                        >
                            {displayTitle}
                            {onTitleChange && (
                                <span className="ml-1.5 text-zinc-600 text-xs font-normal">
                                    ✎
                                </span>
                            )}
                        </button>
                    )}
                    <p className="text-xs text-zinc-500">
                        {game.white} vs {game.black}
                        {game.played_at
                            ? ` · ${new Date(game.played_at).toLocaleDateString()}`
                            : ''}
                        {' · '}
                        <span className="font-mono">{game.result || '*'}</span>
                    </p>
                </div>
            </div>

            <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                {(['review', 'trainer', 'studies'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => onTabChange(t)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                            tab === t
                                ? 'bg-zinc-700 text-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}

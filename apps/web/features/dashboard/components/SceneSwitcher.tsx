'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Clapperboard,
    Plus,
    Trash2,
    Check,
    ChevronDown,
    Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { Scene } from '@/features/dashboard/hooks/useScenes';

interface SceneSwitcherProps {
    scenes: Scene[];
    onSave: (name: string) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    /** Render as embedded content without the dropdown shell */
    inline?: boolean;
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface SaveRowProps {
    scenes: Scene[];
    onSave: (name: string) => void;
}

function SaveRow({ scenes, onSave }: SaveRowProps) {
    const [saveName, setSaveName] = useState('');
    function handleSave() {
        const name = saveName.trim() || `Scene ${scenes.length + 1}`;
        onSave(name);
        setSaveName('');
    }
    return (
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Save current state
            </p>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Scene name…"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="flex-1 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                >
                    <Plus size={11} /> Save
                </button>
            </div>
        </div>
    );
}

interface SceneListProps {
    scenes: Scene[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
}

function SceneList({ scenes, onLoad, onDelete, onRename }: SceneListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    function startEdit(scene: Scene) {
        setEditingId(scene.id);
        setEditValue(scene.name);
    }
    function commitEdit(id: string) {
        if (editValue.trim()) onRename(id, editValue.trim());
        setEditingId(null);
    }
    if (scenes.length === 0)
        return (
            <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-4">
                No saved scenes yet
            </p>
        );
    return (
        <div className="p-2 space-y-1">
            {scenes.map((scene) => (
                <div
                    key={scene.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 group"
                >
                    {editingId === scene.id ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(scene.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(scene.id);
                                if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                    ) : (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                                {scene.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                                {new Date(scene.createdAt).toLocaleDateString(
                                    undefined,
                                    { month: 'short', day: 'numeric' },
                                )}
                            </p>
                        </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onLoad(scene.id)}
                            title="Load scene"
                            className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                            <Check size={12} />
                        </button>
                        <button
                            onClick={() => startEdit(scene)}
                            title="Rename"
                            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={() => onDelete(scene.id)}
                            title="Delete"
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SceneContent({
    scenes,
    onSave,
    onLoad,
    onDelete,
    onRename,
}: Omit<SceneSwitcherProps, 'inline'>) {
    return (
        <>
            <SaveRow scenes={scenes} onSave={onSave} />
            <div className="max-h-48 overflow-y-auto no-scrollbar">
                <SceneList
                    scenes={scenes}
                    onLoad={onLoad}
                    onDelete={onDelete}
                    onRename={onRename}
                />
            </div>
        </>
    );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function SceneSwitcher({
    scenes,
    onSave,
    onLoad,
    onDelete,
    onRename,
    inline,
}: SceneSwitcherProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    if (inline) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <SceneContent
                    scenes={scenes}
                    onSave={onSave}
                    onLoad={onLoad}
                    onDelete={onDelete}
                    onRename={onRename}
                />
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title="Scenes"
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    open
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                )}
            >
                <Clapperboard size={13} /> <span>Scenes</span>
                <ChevronDown
                    size={11}
                    className={cn('transition-transform', open && 'rotate-180')}
                />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden">
                    <SceneContent
                        scenes={scenes}
                        onSave={onSave}
                        onLoad={(id) => {
                            onLoad(id);
                            setOpen(false);
                        }}
                        onDelete={onDelete}
                        onRename={onRename}
                    />
                </div>
            )}
        </div>
    );
}

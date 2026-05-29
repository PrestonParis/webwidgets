'use client';

import { useState } from 'react';
import { Edit3, MoreVertical } from 'lucide-react';

export interface Action {
    id: 'edit' | 'delete';
    label: string;
    onClick: () => void;
    icon: typeof Edit3;
    destructive?: boolean;
}

export function ActionButtons({ actions }: { actions: Action[] }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <>
            {/* Desktop: Opacity reveal on hover */}
            <div className="hidden sm:flex items-center gap-2">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-emerald-400 transition-all"
                        title={action.label}
                    >
                        <action.icon size={12} />
                    </button>
                ))}
            </div>

            {/* Mobile: Menu button */}
            <div className="sm:hidden relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                    title="Actions"
                >
                    <MoreVertical size={14} />
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-6 z-10 rounded-lg bg-zinc-800 border border-zinc-700 shadow-lg min-w-32 overflow-hidden">
                        {actions.map((action, idx) => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    action.onClick();
                                    setShowMenu(false);
                                }}
                                className={`block w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                    action.destructive
                                        ? 'text-red-400 hover:bg-red-900/20'
                                        : 'text-gray-300 hover:bg-zinc-700'
                                } ${idx > 0 ? 'border-t border-zinc-700' : ''}`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

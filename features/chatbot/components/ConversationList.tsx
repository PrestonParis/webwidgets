'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ChatConversation } from '@/features/chatbot/types/chat';

interface Props {
    conversations: ChatConversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}

export function ConversationList({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
}: Props) {
    return (
        <div className="flex flex-col h-full w-56 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Conversations
                </span>
                <button
                    type="button"
                    onClick={onNew}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#4f6ef7]"
                    title="New conversation"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && (
                    <p className="text-xs text-gray-400 p-3">
                        No conversations yet
                    </p>
                )}
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`group flex items-center justify-between px-3 py-2 cursor-pointer ${
                            conv.id === activeId
                                ? 'bg-[#4f6ef7]/10 border-r-2 border-[#4f6ef7]'
                                : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(conv.id)}
                            className="flex-1 text-left truncate"
                        >
                            <span
                                className={`text-sm truncate block ${conv.id === activeId ? 'font-medium text-[#4f6ef7]' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                                {conv.title}
                            </span>
                            <span className="text-xs text-gray-400">
                                {conv.model}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(conv.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

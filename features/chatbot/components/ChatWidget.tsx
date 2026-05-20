'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';

export default function ChatWidget() {
    const chat = useChat();
    const { savedProviders } = useModelKeys();

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                <ModelSelector
                    selectedModel={chat.selectedModel}
                    onSelect={chat.setModel}
                    savedProviders={savedProviders}
                />
                <Link
                    href="/chat"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title="Open full chat"
                >
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
            </div>

            {chat.error && (
                <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 shrink-0">
                    {chat.error}
                </div>
            )}

            <MessageList
                messages={chat.messages}
                streamingContent={chat.streamingContent}
                isStreaming={chat.isStreaming}
            />

            <MessageInput
                onSend={(content) => void chat.sendMessage(content)}
                disabled={chat.isStreaming}
                placeholder="Ask anything…"
            />
        </div>
    );
}

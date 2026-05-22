'use client';

import { Bot } from 'lucide-react';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import WidgetShell from '@/features/widgets/components/WidgetShell';

export default function ChatWidget({
    widgetId = 'chat',
}: {
    widgetId?: string;
}) {
    const chat = useChat();
    const { savedProviders, availability } = useModelKeys();

    return (
        <WidgetShell
            icon={<Bot size={16} />}
            title="AI Chat"
            badge={chat.isStreaming ? 'thinking' : chat.selectedProvider}
            widgetId={widgetId}
            widgetType="chat"
            footerHref="/chat"
            footerLabel="Open full chat ->"
        >
            <div className="flex min-h-[340px] flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-zinc-800 shrink-0">
                <ModelSelector
                    selectedModel={chat.selectedModel}
                    onSelect={chat.setModel}
                    savedProviders={savedProviders}
                    availability={availability}
                />
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
        </WidgetShell>
    );
}

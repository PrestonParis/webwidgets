'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';
import { useChat } from '@/features/chatbot/hooks/useChat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';
import { useChatContext } from '@/features/chatbot/hooks/useChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ModelSelector } from './ModelSelector';
import { ContextStatusPanel } from './ContextStatusPanel';
import WidgetShell from '@/features/widgets/components/WidgetShell';

export default function ChatWidget({
    widgetId = 'chat',
}: {
    widgetId?: string;
}) {
    const chat = useChat();
    const { savedProviders, availability } = useModelKeys();
    const chatContext = useChatContext();

    const hasProvider = availability.some((p) => p.available);
    const sendDisabled =
        chat.isStreaming || !chat.isAuthenticated || !hasProvider;

    return (
        <WidgetShell
            icon={<Bot size={16} />}
            title="AI Chat"
            badge={chat.isStreaming ? 'thinking…' : chat.selectedProvider}
            widgetId={widgetId}
            widgetType="chat"
            footerHref="/chat"
            footerLabel="Open full chat →"
        >
            <div className="flex min-h-85 flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-zinc-800 shrink-0">
                    <ModelSelector
                        selectedModel={chat.selectedModel}
                        onSelect={chat.setModel}
                        savedProviders={savedProviders}
                        availability={availability}
                    />
                    <ContextStatusPanel
                        context={chatContext.context}
                        loading={chatContext.loading}
                        error={chatContext.errorMessage}
                        onRefresh={chatContext.refresh}
                        compact
                    />
                </div>

                {chat.error && (
                    <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 shrink-0">
                        {chat.error}
                    </div>
                )}

                {!chat.isAuthenticated && (
                    <div className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 shrink-0">
                        Sign in to use AI Chat.
                    </div>
                )}

                {chat.isAuthenticated && !hasProvider && (
                    <div className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 shrink-0">
                        No model provider configured.{' '}
                        <Link
                            href="/settings"
                            className="font-semibold underline"
                        >
                            Settings →
                        </Link>
                    </div>
                )}

                <MessageList
                    messages={chat.messages}
                    streamingContent={chat.streamingContent}
                    isStreaming={chat.isStreaming}
                />

                <MessageInput
                    onSend={(content) =>
                        void chat.sendMessage(content, chatContext.context)
                    }
                    disabled={sendDisabled}
                    placeholder={
                        !chat.isAuthenticated
                            ? 'Sign in to chat…'
                            : !hasProvider
                              ? 'No provider configured…'
                              : chatContext.loading
                                ? 'Loading context…'
                                : 'Message…'
                    }
                />
            </div>
        </WidgetShell>
    );
}

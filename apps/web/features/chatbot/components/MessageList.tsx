'use client';

import { useEffect, useRef } from 'react';
import type {
    ChatMessage,
    MessageListProps,
} from '@/features/chatbot/types/chat';

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                        ? 'bg-[#4f6ef7] text-white rounded-tr-md'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-tl-md'
                }`}
            >
                <p className="whitespace-pre-wrap wrap-break-word">
                    {message.content}
                </p>
                {message.model && (
                    <span className="mt-1 block text-[10px] opacity-50">
                        {message.model}
                    </span>
                )}
            </div>
        </div>
    );
}

function StreamingBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                {content ? (
                    <p className="whitespace-pre-wrap wrap-break-word">
                        {content}
                    </p>
                ) : (
                    <span className="flex gap-1 py-1">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </span>
                )}
            </div>
        </div>
    );
}

export function MessageList({
    messages,
    streamingContent,
    isStreaming,
}: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, streamingContent]);

    if (messages.length === 0 && !isStreaming) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs text-center max-w-52 leading-relaxed">
                    Type a message below. Available context sources will be
                    included automatically.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && <StreamingBubble content={streamingContent} />}
            <div ref={bottomRef} />
        </div>
    );
}

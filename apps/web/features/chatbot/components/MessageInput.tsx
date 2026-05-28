'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import type { MessageInputProps } from '@/features/chatbot/types/chat';

export function MessageInput({
    onSend,
    disabled,
    placeholder = 'Ask anything…',
}: MessageInputProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
        }
    };

    return (
        <div className="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-zinc-800">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30 disabled:opacity-50 max-h-40 overflow-y-auto"
            />
            <button
                type="button"
                onClick={submit}
                disabled={disabled || !text.trim()}
                className="p-2 rounded-xl bg-[#4f6ef7] hover:bg-[#3d5ce8] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
    );
}

import { useEditor } from '@tiptap/react';
import type { TranscriptionState } from '@/features/journal/hooks/useTranscription';

function ToolbarButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                active
                    ? 'bg-stone-800 text-amber-50 dark:bg-amber-50 dark:text-stone-900'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200'
            }`}
        >
            {children}
        </button>
    );
}

const divider = <span className="w-px bg-stone-200 dark:bg-zinc-700 mx-1" />;

export default function EditorToolbar({
    editor,
    transcription,
}: {
    editor: ReturnType<typeof useEditor> | null;
    transcription?: TranscriptionState;
}) {
    if (!editor) return null;

    const ch = editor.chain().focus();

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 dark:border-zinc-700 pb-2 mb-3">
            <ToolbarButton
                active={editor.isActive('bold')}
                onClick={() => ch.toggleBold().run()}
            >
                <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
                active={editor.isActive('italic')}
                onClick={() => ch.toggleItalic().run()}
            >
                <em>I</em>
            </ToolbarButton>
            <ToolbarButton
                active={editor.isActive('strike')}
                onClick={() => ch.toggleStrike().run()}
            >
                <s>S</s>
            </ToolbarButton>

            {divider}

            <ToolbarButton
                active={editor.isActive('heading', { level: 2 })}
                onClick={() => ch.toggleHeading({ level: 2 }).run()}
            >
                H2
            </ToolbarButton>
            <ToolbarButton
                active={editor.isActive('heading', { level: 3 })}
                onClick={() => ch.toggleHeading({ level: 3 }).run()}
            >
                H3
            </ToolbarButton>

            {divider}

            <ToolbarButton
                active={editor.isActive('bulletList')}
                onClick={() => ch.toggleBulletList().run()}
            >
                • List
            </ToolbarButton>
            <ToolbarButton
                active={editor.isActive('orderedList')}
                onClick={() => ch.toggleOrderedList().run()}
            >
                1. List
            </ToolbarButton>
            <ToolbarButton
                active={editor.isActive('blockquote')}
                onClick={() => ch.toggleBlockquote().run()}
            >
                ❝
            </ToolbarButton>

            {transcription?.isSupported && (
                <>
                    {divider}
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if (transcription.isListening) {
                                transcription.stop();
                            } else {
                                transcription.start();
                            }
                        }}
                        title={
                            transcription.isListening
                                ? 'Stop dictation'
                                : 'Start dictation'
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                            transcription.isListening
                                ? 'bg-red-500 text-white'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        <span
                            className={
                                transcription.isListening ? 'animate-pulse' : ''
                            }
                        >
                            🎙
                        </span>
                        {transcription.isListening && (
                            <span className="text-xs">Stop</span>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}

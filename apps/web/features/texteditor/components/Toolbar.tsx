import { useEditor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Strikethrough,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface ToolbarProps {
    editor: ReturnType<typeof useEditor> | null;
    compact?: boolean;
    trailingSlot?: React.ReactNode;
}

function Btn({
    active,
    onClick,
    children,
    label,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            title={label}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
                active
                    ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800',
            )}
        >
            {children}
        </button>
    );
}

const Sep = () => (
    <span className="w-px h-4 bg-stone-200 dark:bg-zinc-700 mx-0.5" />
);

export function Toolbar({
    editor,
    compact = false,
    trailingSlot,
}: ToolbarProps) {
    if (!editor) return null;

    const ic = compact ? 13 : 14;
    const ch = editor.chain().focus();

    return (
        <div
            className={cn(
                'flex items-center gap-1',
                trailingSlot ? 'w-full justify-between' : '',
            )}
        >
            <div className="flex items-center gap-0.5">
                <Btn
                    active={editor.isActive('bold')}
                    onClick={() => ch.toggleBold().run()}
                    label="Bold"
                >
                    <Bold size={ic} />
                </Btn>
                <Btn
                    active={editor.isActive('italic')}
                    onClick={() => ch.toggleItalic().run()}
                    label="Italic"
                >
                    <Italic size={ic} />
                </Btn>
                <Btn
                    active={editor.isActive('strike')}
                    onClick={() => ch.toggleStrike().run()}
                    label="Strikethrough"
                >
                    <Strikethrough size={ic} />
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => ch.toggleHeading({ level: 2 }).run()}
                    label="Heading 2"
                >
                    <Heading2 size={ic} />
                </Btn>
                <Btn
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => ch.toggleHeading({ level: 3 }).run()}
                    label="Heading 3"
                >
                    <Heading3 size={ic} />
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive('bulletList')}
                    onClick={() => ch.toggleBulletList().run()}
                    label="Bullet list"
                >
                    <List size={ic} />
                </Btn>
                <Btn
                    active={editor.isActive('orderedList')}
                    onClick={() => ch.toggleOrderedList().run()}
                    label="Numbered list"
                >
                    <ListOrdered size={ic} />
                </Btn>
                <Btn
                    active={editor.isActive('blockquote')}
                    onClick={() => ch.toggleBlockquote().run()}
                    label="Quote"
                >
                    <Quote size={ic} />
                </Btn>
            </div>
            {trailingSlot}
        </div>
    );
}

import { useEditor } from "@tiptap/react";

// A simple toolbar for the Tiptap editor, with buttons for bold, italic, strike, headings, lists, and blockquotes.
export default function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
    if (!editor) return null;

    const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
        ? "bg-stone-800 text-amber-50 dark:bg-amber-50 dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200"
    }`;

    // Styling located in constants.ts for better readability and separation of concerns
    return (
    <div className="flex flex-wrap gap-1 border-b border-stone-200 dark:border-zinc-700 pb-2 mb-3">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={btn(editor.isActive("bold"))}><strong>B</strong></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={btn(editor.isActive("italic"))}><em>I</em></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }} className={btn(editor.isActive("strike"))}><s>S</s></button>
        <span className="w-px bg-stone-200 dark:bg-zinc-700 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} className={btn(editor.isActive("heading", { level: 2 }))}>H2</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} className={btn(editor.isActive("heading", { level: 3 }))}>H3</button>
        <span className="w-px bg-stone-200 dark:bg-zinc-700 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={btn(editor.isActive("bulletList"))}>• List</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={btn(editor.isActive("orderedList"))}>1. List</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }} className={btn(editor.isActive("blockquote"))}>❝</button>
    </div>
    );
}
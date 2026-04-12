"use client"

import Header from "@/components/Global/Header";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  deleted_at: string | null;
  created_at: string;
}

// ─── Tiptap styles ────────────────────────────────────────────────────────────

const TIPTAP_STYLES = `
  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left; color: #a8a29e; pointer-events: none; height: 0;
  }
  .dark .tiptap p.is-editor-empty:first-child::before { color: #52525b; }
  .tiptap:focus-visible { outline: none; }
  .tiptap h2 { font-size: 1.2rem; font-weight: 700; margin: 0.75rem 0 0.25rem; font-family: Georgia, serif; }
  .tiptap h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
  .tiptap blockquote {
    border-left: 3px solid #d6d3d1; padding-left: 1rem;
    color: #78716c; font-style: italic; margin: 0.5rem 0;
  }
  .dark .tiptap blockquote { border-color: #3f3f46; color: #a1a1aa; }
  .tiptap ul, .tiptap ol { padding-left: 1.25rem; }
  .tiptap li { margin: 0.2rem 0; }
  .tiptap p { margin: 0.25rem 0; }
`;

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors ${
      active
        ? "bg-stone-800 text-amber-50 dark:bg-amber-50 dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200"
    }`;

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

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onDelete,
  onEdit,
  onRestore,
  isTrash,
}: {
  entry: JournalEntry;
  onDelete: (id: number) => void;
  onEdit?: (entry: JournalEntry) => void;
  onRestore?: (id: number) => void;
  isTrash?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const plainText = entry.content.replace(/<[^>]+>/g, "");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  return (
    <article className="group bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden">
      {entry.image_url && (
        <div className="h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <div className="p-6">
        {/* Header row: clickable title area + action buttons */}
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Clicking title/date opens edit mode (not available in trash) */}
          <div
            className={`flex-1 min-w-0 ${!isTrash ? "cursor-pointer" : ""}`}
            onClick={() => !isTrash && onEdit?.(entry)}
          >
            <time className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-medium">
              {new Date(entry.created_at).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </time>
            <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-zinc-100 mt-0.5 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {entry.title}
            </h3>
          </div>

          {/* Action buttons — trash vs normal */}
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {isTrash ? (
              <button
                onClick={() => onRestore?.(entry.id)}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Restore
              </button>
            ) : (
              <>
                {/* Edit pencil */}
                <button
                  onClick={() => onEdit?.(entry)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400 text-sm"
                  title="Edit entry"
                >
                  ✎
                </button>

                {/* Trash with inline confirmation */}
                {isConfirming ? (
                  <div className="flex gap-1 items-center bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-bold text-red-500 uppercase">Trash?</span>
                    <button onClick={() => onDelete(entry.id)} className="text-red-500 font-bold text-xs hover:text-red-700">Yes</button>
                    <button onClick={() => setIsConfirming(false)} className="text-stone-400 text-xs hover:text-stone-600">No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirming(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-500 text-lg leading-none"
                    title="Move to trash"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content preview / full */}
        <div
          className={`text-stone-600 dark:text-zinc-400 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none ${!expanded ? "line-clamp-3" : ""}`}
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
          <span className="text-[11px] text-stone-400 dark:text-zinc-600">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-medium text-amber-700 dark:text-amber-500 hover:underline"
          >
            {expanded ? "Show less" : "Read more →"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function JournalForm() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"all" | "trash">("all");
  // null = creating new entry; number = editing that entry's id
  const [editingId, setEditingId] = useState<number | null>(null);
  const [autosaved, setAutosaved] = useState(false);
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the form is currently loaded with edit content so the
  // draft-restore effect doesn't clobber it on re-render.
  const isEditingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    Promise.resolve().then(() => setIsMounted(true));
  }, []);

  // ── Tiptap ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    editable: true,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "What's on your mind today…" }),
      CharacterCount,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[180px] outline-none prose prose-stone dark:prose-invert max-w-none text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      // Don't autosave to localStorage while editing an existing entry
      if (isEditingRef.current) return;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        localStorage.setItem("journal_draft", JSON.stringify({ title, content: editor.getHTML() }));
        setAutosaved(true);
        setTimeout(() => setAutosaved(false), 2000);
      }, 1500);
    },
  });

  // ── Restore draft — only when not editing an existing entry ──────────────
  useEffect(() => {
    if (!editor || !isMounted || isEditingRef.current) return;
    setTimeout(() => {
      try {
        const raw = localStorage.getItem("journal_draft");
        if (!raw) return;
        const { title: t, content: c } = JSON.parse(raw);
        setTitle(t || "");
        editor.commands.setContent(c || "");
      } catch {}
    }, 0);
  }, [editor, isMounted]);

  // ── Fetch entries ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      let query = supabase
        .from("journals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (view === "all") query = query.is("deleted_at", null);
      else query = query.not("deleted_at", "is", null);

      const { data, error } = await query;
      if (error) console.error("Fetch error:", error.message, error.hint);
      else setEntries(data || []);
    };
    load();
  }, [session, refreshKey, view]);

  // ── Start editing ─────────────────────────────────────────────────────────
  const handleEditClick = useCallback((entry: JournalEntry) => {
    isEditingRef.current = true;
    setEditingId(entry.id);
    setTitle(entry.title);
    editor?.commands.setContent(entry.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editor]);

  // ── Cancel edit ───────────────────────────────────────────────────────────
  const cancelEdit = useCallback(() => {
    isEditingRef.current = false;
    setEditingId(null);
    setTitle("");
    editor?.commands.clearContent();
  }, [editor]);

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !editor) return;

    const html = editor.getHTML();
    if (!title.trim() || !html || html === "<p></p>") return;

    setIsSaving(true);

    if (editingId !== null) {
      const { error } = await supabase
        .from("journals")
        .update({
          title: title.trim(),
          content: html,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .eq("user_id", session.user.id);

      if (error) console.error("Update error:", error.message, error.hint);
    } else {
      const { error } = await supabase
        .from("journals")
        .insert([{ title: title.trim(), content: html, user_id: session.user.id }]);

      if (error) console.error("Insert error:", error.message, error.hint);
      else localStorage.removeItem("journal_draft");
    }

    // Reset form
    isEditingRef.current = false;
    setEditingId(null);
    setTitle("");
    editor.commands.clearContent();
    setRefreshKey((k) => k + 1);
    setIsSaving(false);
  };

  // ── Soft delete ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    const { error } = await supabase
      .from("journals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session?.user?.id);

    if (error) { console.error("Delete error:", error.message); return; }
    // If we're currently editing this entry, cancel the edit
    if (editingId === id) cancelEdit();
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [session, editingId, cancelEdit]);

  // ── Restore from trash ────────────────────────────────────────────────────
  const handleRestore = useCallback(async (id: number) => {
    const { error } = await supabase
      .from("journals")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", session?.user?.id);

    if (error) { console.error("Restore error:", error.message); return; }
    setRefreshKey((k) => k + 1);
  }, [session]);

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filtered = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.content.replace(/<[^>]+>/g, "").toLowerCase().includes(q);
  });

  const wordCount = editor?.storage.characterCount.words() ?? 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIPTAP_STYLES }} />

      {focusMode && (
        <div className="fixed inset-0 bg-stone-950/60 z-10 backdrop-blur-sm" onClick={() => setFocusMode(false)} />
      )}

      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Page header */}
        <header className="lg:col-span-12 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">Journal</h1>
          </div>
          <span className="text-sm text-stone-400 dark:text-zinc-500">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </header>

        {/* ── Form column ── */}
        <section className={`lg:col-span-4 transition-all duration-300 ${focusMode ? "relative z-20" : ""}`}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm sticky top-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-zinc-800">
              <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-zinc-100">
                {editingId !== null ? "Edit Entry" : "New Entry"}
              </h2>
              <div className="flex items-center gap-3">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-xs text-stone-400 hover:text-red-400 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFocusMode((v) => !v)}
                  className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                >
                  {focusMode ? "✕ Exit focus" : "⊡ Focus"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Entry title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full font-serif text-lg font-semibold bg-transparent border-0 border-b border-stone-200 dark:border-zinc-700 pb-2 outline-none text-stone-900 dark:text-zinc-100 placeholder:text-stone-300 dark:placeholder:text-zinc-600 focus:border-amber-500 transition-colors"
              />

              <div className="border border-stone-200 dark:border-zinc-700 rounded-xl p-3 focus-within:border-amber-500 transition-colors min-h-55">
                {isMounted ? (
                  <>
                    <EditorToolbar editor={editor} />
                    <EditorContent editor={editor} />
                  </>
                ) : (
                  <div className="min-h-45 flex items-center justify-center text-stone-300 dark:text-zinc-600 text-sm">
                    Loading editor…
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-600">
                <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                <span className={`transition-opacity duration-500 ${autosaved ? "opacity-100 text-emerald-500" : "opacity-0"}`}>
                  Draft saved
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-700 dark:hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-40 text-sm tracking-wide"
              >
                {isSaving ? "Saving…" : editingId !== null ? "Update Entry" : "Save Entry"}
              </button>
            </form>
          </div>
        </section>

        {/* ── Entries column ── */}
        <section className="lg:col-span-8 space-y-6">
          {/* View toggle */}
          <div className="flex gap-4 border-b border-stone-100 dark:border-zinc-800 pb-2">
            <button
              onClick={() => setView("all")}
              className={`text-sm font-medium transition-colors ${view === "all" ? "text-amber-600" : "text-stone-400 hover:text-stone-600"}`}
            >
              Recent
            </button>
            <button
              onClick={() => setView("trash")}
              className={`text-sm font-medium transition-colors ${view === "trash" ? "text-amber-600" : "text-stone-400 hover:text-stone-600"}`}
            >
              Trash
            </button>
          </div>

          {/* Search */}
          {view === "all" && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 pointer-events-none">⌕</span>
              <input
                type="search"
                placeholder="Search entries…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {/* Entry list */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900/50 p-16 rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-800 text-center">
              <p className="font-serif text-2xl text-stone-300 dark:text-zinc-600 mb-2">
                {view === "trash" ? "Trash is empty." : searchQuery ? "No entries found." : "The page is blank."}
              </p>
              <p className="text-sm text-stone-400 dark:text-zinc-600">
                {view === "trash"
                  ? "Deleted entries will appear here."
                  : searchQuery
                  ? "Try a different search term."
                  : "Your first entry is waiting to be written."}
              </p>
            </div>
          ) : (
            filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onEdit={handleEditClick}
                onRestore={handleRestore}
                isTrash={view === "trash"}
              />
            ))
          )}
        </section>
      </main>
    </>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <JournalForm />
    </>
  );
}
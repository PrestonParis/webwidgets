import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { JournalEntry } from "@/types/journal";
import { TIPTAP_STYLES } from "./constants";
import EditorToolbar from "@/components/Journal/EditorToolbar";
import EntryCard from "@/components/Journal/EntryCard";

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function JournalForm() {
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"all" | "trash">("all");
    const [editingId, setEditingId] = useState<number | null>(null); // null = creating new entry; number = editing that entry's id
    const [autosaved, setAutosaved] = useState(false);
    const isMountedRef = useRef(false);
    const [isMounted, setIsMounted] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isEditingRef = useRef(false); // draft-restore effect doesn't remove edited content

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
    // If currently editing this entry, cancel the edit
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
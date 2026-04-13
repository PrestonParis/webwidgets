"use client"

import { useState } from "react";
import { EntryCardProps } from "@/types/journal";

export default function EntryCard({ entry, onDelete, onEdit, onRestore, isTrash }: EntryCardProps) {
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
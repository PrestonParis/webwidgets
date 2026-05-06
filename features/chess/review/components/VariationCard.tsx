'use client';

import { useState } from 'react';
import { VariationCardProps } from '../types/review';

export function VariationCard({
    variation,
    onSelect,
    onDelete,
    onUpdateAnnotation,
}: VariationCardProps) {
    const [editingAnnotation, setEditingAnnotation] = useState(false);
    const [annotationDraft, setAnnotationDraft] = useState(
        variation.annotation ?? '',
    );

    const commitAnnotation = () => {
        setEditingAnnotation(false);
        const trimmed = annotationDraft.trim();
        if (trimmed !== (variation.annotation ?? '')) {
            onUpdateAnnotation?.(variation.id, trimmed);
        }
    };

    return (
        <div className="bg-zinc-800 rounded-lg p-3 group">
            <div className="flex justify-between items-start mb-1">
                <button
                    onClick={() => onSelect(variation)}
                    className="text-xs font-medium text-zinc-100 hover:text-blue-400 transition-colors text-left"
                >
                    {variation.title}
                </button>
                <button
                    onClick={() => onDelete(variation.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-2 shrink-0"
                >
                    ✕
                </button>
            </div>

            {editingAnnotation ? (
                <textarea
                    autoFocus
                    value={annotationDraft}
                    onChange={(e) => setAnnotationDraft(e.target.value)}
                    onBlur={commitAnnotation}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setAnnotationDraft(variation.annotation ?? '');
                            setEditingAnnotation(false);
                        }
                    }}
                    placeholder="Add annotation…"
                    rows={2}
                    className="w-full text-[11px] bg-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none border border-zinc-600 focus:border-blue-500 resize-none"
                />
            ) : (
                <button
                    onClick={
                        onUpdateAnnotation
                            ? () => {
                                  setAnnotationDraft(
                                      variation.annotation ?? '',
                                  );
                                  setEditingAnnotation(true);
                              }
                            : undefined
                    }
                    className={`w-full text-left text-[11px] leading-relaxed min-h-5 ${
                        variation.annotation
                            ? 'text-zinc-500'
                            : 'text-zinc-700 italic'
                    } ${onUpdateAnnotation ? 'hover:text-zinc-400 cursor-text' : ''}`}
                >
                    {variation.annotation ||
                        (onUpdateAnnotation ? 'Add annotation…' : '')}
                </button>
            )}

            <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                <span>Practiced: {variation.practiced_count}×</span>
                {variation.last_practiced && (
                    <span>
                        Last:{' '}
                        {new Date(
                            variation.last_practiced,
                        ).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}

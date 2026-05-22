'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalysisBoard } from '@/features/chess/analysis/components/AnalysisBoard';
import LoadingState from '@/features/ui/components/LoadingState';
import { useStudyDetail } from '@/features/chess/studies/hooks/useStudyDetail';
import type { StudyChapter } from '@/features/chess/types/chess';

function ChapterSidebar({
    chapters,
    activeChapterId,
    onSelect,
    onAdd,
    onRename,
    onDelete,
}: {
    chapters: StudyChapter[];
    activeChapterId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string) => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState('');

    function commitRename(chapter: StudyChapter) {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== chapter.title)
            void onRename(chapter.id, trimmed);
        setEditingId(null);
    }

    return (
        <div className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Chapters
                </span>
                <button
                    onClick={onAdd}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    + Add
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chapters.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic p-3">
                        No chapters yet.
                    </p>
                ) : (
                    chapters.map((chapter, idx) => (
                        <div
                            key={chapter.id}
                            className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-zinc-900 transition-colors ${activeChapterId === chapter.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                            onClick={() => onSelect(chapter.id)}
                        >
                            <span className="text-xs text-zinc-600 shrink-0 w-5">
                                {idx + 1}.
                            </span>
                            {editingId === chapter.id ? (
                                <input
                                    autoFocus
                                    value={draft}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onBlur={() => commitRename(chapter)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            commitRename(chapter);
                                        if (e.key === 'Escape')
                                            setEditingId(null);
                                    }}
                                    className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-1 py-0.5 outline-none border border-zinc-500 min-w-0"
                                />
                            ) : (
                                <span
                                    className="flex-1 text-sm truncate"
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setDraft(chapter.title);
                                        setEditingId(chapter.id);
                                    }}
                                >
                                    {chapter.title}
                                </span>
                            )}
                            {chapters.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void onDelete(chapter.id);
                                    }}
                                    className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-colors text-xs shrink-0"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function StudyDetailPage() {
    const { studyId } = useParams<{ studyId: string }>();
    const router = useRouter();
    const {
        study,
        chapters,
        activeChapter,
        activeChapterId,
        setActiveChapterId,
        loading,
        handleChapterPgnChange,
        handleAddChapter,
        handleRenameChapter,
        handleDeleteChapter,
    } = useStudyDetail(studyId);

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                    <button
                        onClick={() => router.push('/chess/studies')}
                        className="text-sm text-zinc-500 hover:text-zinc-300 mb-1 block transition-colors"
                    >
                        ← Back to Studies
                    </button>
                    <h1 className="text-xl font-bold">
                        {study?.title ?? 'Study'}
                    </h1>
                    {study?.description && (
                        <p className="text-zinc-500 text-sm">
                            {study.description}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => {
                        void handleAddChapter();
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    + Add Chapter
                </button>
            </div>

            <div className="flex flex-1 min-h-0">
                <ChapterSidebar
                    chapters={chapters}
                    activeChapterId={activeChapterId}
                    onSelect={setActiveChapterId}
                    onAdd={() => {
                        void handleAddChapter();
                    }}
                    onRename={(id, title) => {
                        void handleRenameChapter(id, title);
                    }}
                    onDelete={(id) => {
                        void handleDeleteChapter(id);
                    }}
                />

                <div className="flex-1 overflow-y-auto p-6">
                    {!activeChapter ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-zinc-600">
                                <p className="text-4xl mb-3">♜</p>
                                <p className="text-sm">
                                    Select a chapter or add one to start.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-semibold mb-1">
                                {activeChapter.title}
                                <span className="ml-2 text-xs text-zinc-600 font-normal">
                                    — double-click chapter name to rename
                                </span>
                            </h2>
                            <p className="text-xs text-zinc-500 mb-4">
                                Analysis saved automatically.
                            </p>
                            <AnalysisBoard
                                key={activeChapter.id}
                                pgn={activeChapter.pgn}
                                onPgnChange={handleChapterPgnChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

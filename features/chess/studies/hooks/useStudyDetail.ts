'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { ChessStudy, StudyChapter } from '@/features/chess/types/chess';
import { studyService } from '@/features/chess/studies/api/studyService';

export function useStudyDetail(studyId: string | undefined) {
    const [study, setStudy] = useState<ChessStudy | null>(null);
    const [chapters, setChapters] = useState<StudyChapter[]>([]);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Debounce timer ref for pgn saves
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!studyId) return;

        void Promise.all([
            studyService.fetchStudy(studyId),
            studyService.fetchChapters(studyId),
        ]).then(([studyData, chapterData]) => {
            setStudy(studyData);
            setChapters(chapterData);
            const firstChapter = chapterData[0];
            if (firstChapter) {
                setActiveChapterId(firstChapter.id);
            }
            setLoading(false);
        });
    }, [studyId]);

    const activeChapter =
        chapters.find((c) => c.id === activeChapterId) ?? null;

    const handleChapterPgnChange = useCallback(
        (pgn: string) => {
            if (!activeChapterId) return;
            // Optimistic update
            setChapters((prev) =>
                prev.map((c) => (c.id === activeChapterId ? { ...c, pgn } : c)),
            );
            // Debounced DB save
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                void studyService.updateChapterPgn(activeChapterId, pgn);
            }, 800);
        },
        [activeChapterId],
    );

    const handleAddChapter = useCallback(async () => {
        if (!studyId) return;
        const title = prompt('Chapter title?');
        if (!title?.trim()) return;

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const position = chapters.length;
        const chapter = await studyService.createChapter(
            studyId,
            user.id,
            title.trim(),
            position,
        );
        setChapters((prev) => [...prev, chapter]);
        setActiveChapterId(chapter.id);
    }, [studyId, chapters.length]);

    const handleRenameChapter = useCallback(
        async (chapterId: string, title: string) => {
            await studyService.updateChapterTitle(chapterId, title);
            setChapters((prev) =>
                prev.map((c) => (c.id === chapterId ? { ...c, title } : c)),
            );
        },
        [],
    );

    const handleDeleteChapter = useCallback(
        async (chapterId: string) => {
            if (chapters.length <= 1) return; // keep at least one chapter
            if (!confirm('Delete this chapter?')) return;
            await studyService.deleteChapter(chapterId);
            const remaining = chapters.filter((c) => c.id !== chapterId);
            setChapters(remaining);
            if (activeChapterId === chapterId) {
                setActiveChapterId(remaining[0]?.id ?? null);
            }
        },
        [chapters, activeChapterId],
    );

    return {
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
    };
}

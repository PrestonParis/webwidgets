'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import type { ChessStudy, StudyChapter } from '@/features/chess/types/chess';
import { studyService } from '@/features/chess/studies/api/studyService';

function scheduleChapterSave(
    chapterId: string,
    pgn: string,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
        () => void studyService.updateChapterPgn(chapterId, pgn),
        800,
    );
}

export function useStudyDetail(studyId: string | undefined) {
    const { user } = useAuthContext();
    const [study, setStudy] = useState<ChessStudy | null>(null);
    const [chapters, setChapters] = useState<StudyChapter[]>([]);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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
            if (firstChapter) setActiveChapterId(firstChapter.id);
            setLoading(false);
        });
    }, [studyId]);

    const activeChapter =
        chapters.find((c) => c.id === activeChapterId) ?? null;

    const handleChapterPgnChange = useCallback(
        (pgn: string) => {
            if (!activeChapterId) return;
            setChapters((prev) =>
                prev.map((c) => (c.id === activeChapterId ? { ...c, pgn } : c)),
            );
            scheduleChapterSave(activeChapterId, pgn, saveTimer);
        },
        [activeChapterId],
    );

    const handleAddChapter = useCallback(async () => {
        if (!studyId || !user?.id) return;
        const title = prompt('Chapter title?');
        if (!title?.trim()) return;
        const chapter = await studyService.createChapter(
            studyId,
            user.id,
            title.trim(),
            chapters.length,
        );
        setChapters((prev) => [...prev, chapter]);
        setActiveChapterId(chapter.id);
    }, [studyId, chapters.length, user]);

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
            if (chapters.length <= 1) return;
            if (!confirm('Delete this chapter?')) return;
            await studyService.deleteChapter(chapterId);
            const remaining = chapters.filter((c) => c.id !== chapterId);
            setChapters(remaining);
            if (activeChapterId === chapterId)
                setActiveChapterId(remaining[0]?.id ?? null);
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

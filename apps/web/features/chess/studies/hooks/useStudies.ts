'use client';
import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import type { ChessStudy } from '@/features/chess/types/chess';
import { studyService } from '@/features/chess/studies/api/studyService';
import { z } from 'zod';

const chessStudySchema = z.object({
    id: z.string(),
    user_id: z.string(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

const chessStudyArraySchema = z.array(chessStudySchema);

export function useStudies() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [studies, setStudies] = useState<ChessStudy[]>([]);
    const [loading, setLoading] = useReducer(
        (_: boolean, v: boolean) => v,
        true,
    );

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        supabase
            .from('chess_studies')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                const parsed = chessStudyArraySchema.safeParse(data);
                setStudies((parsed.success ? parsed.data : []) as ChessStudy[]);
                setLoading(false);
            });
    }, [user?.id]);

    const handleCreate = async () => {
        const title = prompt('Study title?');
        if (!title?.trim()) return;

        if (!user) return;

        const insertResult = await supabase
            .from('chess_studies')
            .insert({ user_id: user.id, title: title.trim() })
            .select()
            .single();

        if (insertResult.error || !insertResult.data) return;
        const data: unknown = insertResult.data;

        const parsed = chessStudySchema.safeParse(data);
        if (!parsed.success) return;

        const study = parsed.data;

        // Auto-create the first chapter
        try {
            await studyService.createChapter(study.id, user.id, 'Chapter 1', 0);
        } catch {
            // non-fatal — study was created, chapter can be added manually
        }

        router.push(`/chess/studies/${study.id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this study and all its chapters?')) return;
        await supabase.from('chess_studies').delete().eq('id', id);
        setStudies((prev) => prev.filter((s) => s.id !== id));
    };

    return { studies, loading, handleCreate, handleDelete };
}

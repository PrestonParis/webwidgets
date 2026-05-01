'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import type { ChessStudy } from '@/features/chess/types/chess';

export function useStudies() {
    const router = useRouter();
    const [studies, setStudies] = useState<ChessStudy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('chess_studies')
            .select('*')
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                setStudies((data as ChessStudy[]) ?? []);
                setLoading(false);
            });
    }, []);

    const handleCreate = async () => {
        const title = prompt('Study title?');
        if (!title?.trim()) return;
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from('chess_studies')
            .insert({ user_id: user.id, title: title.trim() })
            .select()
            .single();
        if (data) router.push(`/chess/studies/${data.id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this study and all its variations?')) return;
        await supabase.from('chess_studies').delete().eq('id', id);
        setStudies((prev) => prev.filter((s) => s.id !== id));
    };

    return { studies, loading, handleCreate, handleDelete };
}

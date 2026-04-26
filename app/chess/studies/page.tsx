'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import type { ChessStudy } from '@/types/chess';

export default function StudiesPage() {
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

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <button
                        onClick={() => router.push('/chess')}
                        className="text-sm text-zinc-500 hover:text-zinc-300 mb-2 block transition-colors"
                    >
                        ← Chess Library
                    </button>
                    <h1 className="text-2xl font-bold">Studies</h1>
                    <p className="text-zinc-500 text-sm">
                        Openings, endgames, and positions you want to master.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    + New Study
                </button>
            </header>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 bg-zinc-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : studies.length === 0 ? (
                <div className="text-center py-24 text-zinc-600">
                    <p className="text-4xl mb-4">♟</p>
                    <p>
                        No studies yet. Create one to start training positions.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {studies.map((s) => (
                        <div
                            key={s.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex justify-between items-center group hover:border-zinc-700 transition-colors"
                        >
                            <button
                                onClick={() =>
                                    router.push(`/chess/studies/${s.id}`)
                                }
                                className="text-left flex-1"
                            >
                                <div className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                                    {s.title}
                                </div>
                                {s.description && (
                                    <div className="text-xs text-zinc-500 mt-0.5">
                                        {s.description}
                                    </div>
                                )}
                                <div className="text-xs text-zinc-600 mt-1">
                                    Updated{' '}
                                    {new Date(
                                        s.updated_at,
                                    ).toLocaleDateString()}
                                </div>
                            </button>
                            <button
                                onClick={() => handleDelete(s.id)}
                                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-4 text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

export function StudiesSidebar({ gameId }: { gameId: string }) {
    const [studies, setStudies] = useState<{ id: string; title: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        // 1. Use gameId to filter the initial fetch
        supabase
            .from('chess_studies')
            .select('id, title')
            .eq('game_id', gameId) // Only fetch studies for this specific game
            .order('updated_at', { ascending: false })
            .then(({ data }) => setStudies(data ?? []));
    }, [gameId]);

    const handleCreateStudy = async () => {
        const title = prompt('Study title?');
        if (!title) return;

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Include game_id in the insert payload
        const { data } = await supabase
            .from('chess_studies')
            .insert({
                user_id: user.id,
                title,
                game_id: gameId, // Associate the new study with the current game
            })
            .select()
            .single();

        if (data) setStudies((prev) => [data, ...prev]);
    };
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Studies
                </h3>
                <button
                    onClick={() => router.push('/chess/studies')}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                    Manage →
                </button>
            </div>
            {studies.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No studies yet.</p>
            ) : (
                <div className="space-y-2">
                    {studies.map((s) => (
                        <button
                            key={s.id}
                            onClick={() =>
                                router.push(`/chess/studies/${s.id}`)
                            }
                            className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                        >
                            <div className="text-sm font-medium text-zinc-100">
                                {s.title}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={async () => {
                    const title = prompt('Study title?');
                    if (!title) return;
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data } = await supabase
                        .from('chess_studies')
                        .insert({ user_id: user.id, title, game_id: gameId })
                        .select()
                        .single();
                    if (data) setStudies((prev) => [data, ...prev]);
                }}
                className="w-full text-sm py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
                <button onClick={handleCreateStudy}>+ New Study</button>
            </button>
        </div>
    );
}

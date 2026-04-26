import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/router';

// ─── Studies Sidebar (stub — fleshed out in StudiesPage) ──────────────────────
export function StudiesSidebar({ gameId }: { gameId: string }) {
    const [studies, setStudies] = useState<{ id: string; title: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        supabase
            .from('chess_studies')
            .select('id, title')
            .order('updated_at', { ascending: false })
            .then(({ data }) => setStudies(data ?? []));
    }, []);

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
                        .insert({ user_id: user.id, title })
                        .select()
                        .single();
                    if (data) setStudies((prev) => [data, ...prev]);
                }}
                className="w-full text-sm py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
                + New Study
            </button>
        </div>
    );
}

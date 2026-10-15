import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const sidebarStudySchema = z.object({
    id: z.string(),
    title: z.string(),
});

const sidebarStudyArraySchema = z.array(sidebarStudySchema);
type SidebarStudy = z.infer<typeof sidebarStudySchema>;

interface StudyState {
    userId: string;
    studies: SidebarStudy[];
}

export default function StudiesSidebar() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [studyState, setStudyState] = useState<StudyState>({
        userId: '',
        studies: [],
    });
    const studies = studyState.userId === user?.id ? studyState.studies : [];

    useEffect(() => {
        const userId = user?.id;
        if (!userId) return;

        supabase
            .from('chess_studies')
            .select('id, title')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                const parsed = sidebarStudyArraySchema.safeParse(data);
                setStudyState({
                    userId,
                    studies: parsed.success ? parsed.data : [],
                });
            });
    }, [user?.id]);

    const handleCreateStudy = async () => {
        const title = prompt('Study title?');
        if (!title) return;

        if (!user) return;

        const result = await supabase
            .from('chess_studies')
            .insert({
                user_id: user.id,
                title,
            })
            .select()
            .single();

        if (result.error || !result.data) {
            console.error('Failed to create study:', result.error);
            return;
        }

        const newStudyId = result.data.id;
        setStudyState((previous) => ({
            userId: user.id,
            studies: [
                { id: newStudyId, title },
                ...(previous.userId === user.id ? previous.studies : []),
            ],
        }));
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
                onClick={() => {
                    void handleCreateStudy();
                }}
                className="w-full text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
                + New Study
            </button>
        </div>
    );
}

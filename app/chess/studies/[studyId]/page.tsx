'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import type { ChessStudy, ChessVariation } from '@/types/chess';
import MoveTrainer from '@/components/Chess/MoveTrainer';
import { AddVariationModal } from '@/components/Chess/AddVariationModal';
import LoadingState from '@/components/Global/LoadingState';

export default function StudyDetailPage() {
    const { studyId } = useParams<{ studyId: string }>();
    const router = useRouter();

    const [study, setStudy] = useState<ChessStudy | null>(null);
    const [variations, setVariations] = useState<ChessVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVariation, setActiveVariation] =
        useState<ChessVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!studyId) return;

        const fetchStudyData = async () => {
            const [studyRes, varRes] = await Promise.all([
                supabase
                    .from('chess_studies')
                    .select('*')
                    .eq('id', studyId)
                    .single(),
                supabase
                    .from('chess_variations')
                    .select('*')
                    .eq('study_id', studyId)
                    .order('created_at'),
            ]);

            if (studyRes.data) setStudy(studyRes.data as ChessStudy);
            if (varRes.data) setVariations(varRes.data as ChessVariation[]);
            setLoading(false);
        };

        fetchStudyData();
    }, [studyId]);

    const handleVariationSaved = (v: ChessVariation) => {
        setVariations((prev) => [...prev, v]);
        setShowAddModal(false);
    };

    const handleVariationDelete = async (id: string) => {
        const { error } = await supabase
            .from('chess_variations')
            .delete()
            .eq('id', id);
        if (!error) {
            setVariations((prev) => prev.filter((v) => v.id !== id));
            if (activeVariation?.id === id) setActiveVariation(null);
        }
    };

    if (loading) <LoadingState />;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
            {/* Header Section */}
            <header className="flex items-start justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.push('/chess/studies')}
                        className="text-sm text-zinc-500 hover:text-zinc-300 mb-2 block transition-colors"
                    >
                        ← Back to Studies
                    </button>
                    <h1 className="text-2xl font-bold">
                        {study?.title ?? 'Study'}
                    </h1>
                    {study?.description && (
                        <p className="text-zinc-500 text-sm mt-1">
                            {study.description}
                        </p>
                    )}
                </div>
                {!activeVariation && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Add Variation
                    </button>
                )}
            </header>

            {/* Main Content: Trainer vs Grid */}
            <main>
                {activeVariation ? (
                    <MoveTrainer
                        variation={activeVariation}
                        layout="expanded" // Using expanded for the dedicated study page
                        onBack={() => setActiveVariation(null)}
                    />
                ) : (
                    <>
                        {variations.length === 0 ? (
                            <div className="text-center py-24 text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl">
                                <p className="text-4xl mb-4">♜</p>
                                <p>
                                    No variations yet. Add one to start
                                    training.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {variations.map((v) => (
                                    <div
                                        key={v.id}
                                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 group hover:border-zinc-700 transition-all"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-zinc-100">
                                                {v.title}
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    handleVariationDelete(v.id)
                                                }
                                                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-2"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {v.annotation && (
                                            <p className="text-xs text-zinc-500 leading-relaxed flex-1 italic">
                                                &quot;{v.annotation}&quot;
                                            </p>
                                        )}

                                        <div className="text-[10px] text-zinc-600 font-mono truncate bg-black/30 p-1.5 rounded">
                                            {v.pgn.slice(0, 60)}
                                            {v.pgn.length > 60 ? '...' : ''}
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                                                {v.practiced_count}× practiced
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setActiveVariation(v)
                                                }
                                                className="text-sm px-4 py-1.5 bg-zinc-800 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                            >
                                                Train →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modals */}
            {showAddModal && studyId && (
                <AddVariationModal
                    studyId={studyId}
                    onClose={() => setShowAddModal(false)}
                    onSaved={handleVariationSaved}
                />
            )}
        </div>
    );
}

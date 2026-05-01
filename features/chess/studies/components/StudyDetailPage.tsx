'use client';

import { useParams, useRouter } from 'next/navigation';
import MoveTrainer from '@/features/chess/movetrainer/components/MoveTrainer';
import { AddVariationModal } from '@/features/chess/components/AddVariationModal';
import { StudyVariationCard } from '@/features/chess/studies/components/StudyVariationCard';
import LoadingState from '@/features/ui/components/LoadingState';
import { useStudyDetail } from '@/features/chess/studies/hooks/useStudyDetail';

export default function StudyDetailPage() {
    const { studyId } = useParams<{ studyId: string }>();
    const router = useRouter();
    const {
        study,
        variations,
        loading,
        activeVariation,
        setActiveVariation,
        showAddModal,
        setShowAddModal,
        handleVariationSaved,
        handleVariationDelete,
    } = useStudyDetail(studyId);

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
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

            <main>
                {activeVariation ? (
                    <MoveTrainer
                        variation={activeVariation}
                        layout="expanded"
                        onBack={() => setActiveVariation(null)}
                    />
                ) : variations.length === 0 ? (
                    <div className="text-center py-24 text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl">
                        <p className="text-4xl mb-4">♜</p>
                        <p>No variations yet. Add one to start training.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variations.map((v) => (
                            <StudyVariationCard
                                key={v.id}
                                variation={v}
                                onTrain={setActiveVariation}
                                onDelete={handleVariationDelete}
                            />
                        ))}
                    </div>
                )}
            </main>

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

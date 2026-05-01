'use client';
import { useStudies } from '@/features/chess/studies/hooks/useStudies';
import StudiesHeader from '@/features/chess/studies/components/StudiesHeader';
import StudiesList from '@/features/chess/studies/components/StudiesList';
import StudiesEmptyState from '@/features/chess/studies/components/StudiesEmptyState';
import StudiesLoadingSkeleton from '@/features/chess/studies/components/StudiesLoadingSkeleton';

export default function StudiesPage() {
    const { studies, loading, handleCreate, handleDelete } = useStudies();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 max-w-4xl mx-auto">
            <StudiesHeader onCreateClick={handleCreate} />
            {loading ? (
                <StudiesLoadingSkeleton />
            ) : studies.length === 0 ? (
                <StudiesEmptyState />
            ) : (
                <StudiesList studies={studies} onDelete={handleDelete} />
            )}
        </div>
    );
}

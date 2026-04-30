'use client';
import { useStudies } from '../hooks/useStudies';
import StudiesHeader from './StudiesHeader';
import StudiesList from './StudiesList';
import StudiesEmptyState from './StudiesEmptyState';
import StudiesLoadingSkeleton from './StudiesLoadingSkeleton';

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

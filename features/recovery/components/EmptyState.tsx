import { EmptyStateProps } from '@/features/recovery/types/recovery';

export default function EmptyState({ onAddClick }: EmptyStateProps) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">
                No trackers yet.
            </p>
            <button
                onClick={onAddClick}
                className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700"
            >
                Add your first tracker
            </button>
        </div>
    );
}

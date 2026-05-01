'use client';
import { useRouter } from 'next/navigation';
import { StudyCardProps } from '@/features/chess/studies/types/studies';

export default function StudyCard({ study, onDelete }: StudyCardProps) {
    const router = useRouter();

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex justify-between items-center group hover:border-zinc-700 transition-colors">
            <button
                onClick={() => router.push(`/chess/studies/${study.id}`)}
                className="text-left flex-1"
            >
                <div className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                    {study.title}
                </div>
                {study.description && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                        {study.description}
                    </div>
                )}
                <div className="text-xs text-zinc-600 mt-1">
                    Updated {new Date(study.updated_at).toLocaleDateString()}
                </div>
            </button>
            <button
                onClick={() => onDelete(study.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-4 text-sm"
            >
                Delete
            </button>
        </div>
    );
}

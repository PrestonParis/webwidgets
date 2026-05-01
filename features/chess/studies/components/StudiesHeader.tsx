'use client';
import { useRouter } from 'next/navigation';
import { StudiesHeaderProps } from '@/features/chess/studies/types/studies';

export default function StudiesHeader({ onCreateClick }: StudiesHeaderProps) {
    const router = useRouter();

    return (
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
                onClick={onCreateClick}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                + New Study
            </button>
        </header>
    );
}

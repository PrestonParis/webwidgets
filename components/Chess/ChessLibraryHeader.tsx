import Link from 'next/link';

export default function ChessLibraryHeader({
    onImport,
}: {
    onImport: () => void;
}) {
    return (
        <header className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Chess Library
                </h1>
                <p className="text-zinc-500 text-sm mt-0.5">
                    Your imported games and analysis positions.{' '}
                    <Link
                        href="/chess/studies"
                        className="text-blue-600 hover:underline"
                    >
                        View Studies →
                    </Link>
                </p>
            </div>
            <button
                onClick={onImport}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Import PGN
            </button>
        </header>
    );
}

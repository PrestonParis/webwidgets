export default function ChessLibraryState({
    loading,
    hasGames,
    onImport,
}: {
    loading: boolean;
    hasGames: boolean;
    onImport: () => void;
}) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!hasGames) {
        return (
            <div className="text-center py-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-4xl mb-4">♟</p>
                <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                    No games yet
                </p>
                <p className="text-sm text-zinc-400 mb-6">
                    Import a PGN from Lichess, Chess.com, or any game file.
                </p>
                <button
                    onClick={onImport}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                    Import your first game
                </button>
            </div>
        );
    }

    return null;
}

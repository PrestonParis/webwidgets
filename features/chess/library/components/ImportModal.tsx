import { ChessGame } from '@/features/chess/types/chess';
import { useImportGame } from '@/features/chess/library/hooks/useImportGame';

export function ImportModal({
    onClose,
    onImported,
}: {
    onClose: () => void;
    onImported: (game: ChessGame) => void;
}) {
    const { pgn, setPgn, error, setError, saving, handleImport } =
        useImportGame(onImported, onClose);

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdrop}
        >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Import PGN
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <textarea
                        autoFocus
                        placeholder={`[Event "World Championship"]\n[White "Kasparov"]\n[Black "Karpov"]\n\n1. e4 e5 2. Nf3 ...`}
                        value={pgn}
                        onChange={(e) => {
                            setPgn(e.target.value);
                            setError(null);
                        }}
                        rows={10}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={saving || !pgn.trim()}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'Importing…' : 'Import Game'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { ChessGame } from '@/features/chess/types/chess';
import { gameService } from '@/features/chess/library/api/gameService';
import { validatePgn, parsePgnHeaders } from '@/features/chess/lib/chessUtils';

export function useImportGame(
    onImported: (game: ChessGame) => void,
    onClose: () => void,
) {
    const { user } = useAuthContext();
    const [pgn, setPgn] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleImport = async () => {
        const trimmed = pgn.trim();
        if (!trimmed) {
            setError('Paste a PGN first.');
            return;
        }
        const validationError = validatePgn(trimmed);
        if (validationError) {
            setError(`Invalid PGN: ${validationError}`);
            return;
        }

        setSaving(true);
        setError(null);

        if (!user) {
            setError('Not signed in.');
            setSaving(false);
            return;
        }

        try {
            const headers = parsePgnHeaders(trimmed);
            const game = await gameService.importGame(
                user.id,
                trimmed,
                headers,
            );
            onImported(game);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Import failed.');
        } finally {
            setSaving(false);
        }
    };

    return { pgn, setPgn, error, setError, saving, handleImport };
}

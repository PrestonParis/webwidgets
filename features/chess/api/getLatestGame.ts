import { chessGameFetch } from '@/lib/api/client';
import { ChessGame } from '@/features/chess/types/chess';

export function getLatestGame(): Promise<ChessGame | null> {
    return chessGameFetch<ChessGame | null>('/api/chess/latest');
}

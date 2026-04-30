import { chessGameFetch } from '@/lib/api/client';

export function getLatestGame() {
    return chessGameFetch('/api/chess/latest');
}

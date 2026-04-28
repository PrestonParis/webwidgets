import { Chess } from 'chess.js';
import { ChessGame, ParsedMove } from '@/types/chess';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Parse a PGN string into an array of moves with from/to/fen.
 * Returns [] on parse failure.
 */
export function parsePgn(pgn: string): ParsedMove[] {
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);
        const history = chess.history({ verbose: true });

        // Replay from scratch to capture FEN after each move
        const replay = new Chess();
        return history.map((move) => {
            replay.move(move.san);
            return {
                san: move.san,
                from: move.from,
                to: move.to,
                fen: replay.fen(),
            };
        });
    } catch {
        return [];
    }
}

/**
 * Parse moves from a PGN anchored at a specific starting FEN.
 * Used for variations that don't start from the initial position.
 */
export function parsePgnFromFen(pgn: string, startFen: string): ParsedMove[] {
    try {
        const chess = new Chess(startFen);
        // chess.js loadPgn with setHeader false to ignore headers
        const moves = pgn
            .trim()
            .split(/\s+/)
            .filter((t) => !/^\d+\./.test(t) && t !== '*');
        const result: ParsedMove[] = [];
        for (const san of moves) {
            const move = chess.move(san);
            if (!move) break;
            result.push({
                san: move.san,
                from: move.from,
                to: move.to,
                fen: chess.fen(),
            });
        }
        return result;
    } catch {
        return [];
    }
}

/**
 * Return the FEN at a specific move index (0 = starting position).
 * Pass startFen to anchor at a position other than the standard starting FEN.
 */
export function fenAtIndex(
    moves: ParsedMove[],
    index: number,
    startFen = STARTING_FEN,
): string {
    if (index === 0 || moves.length === 0) return startFen;
    return moves[Math.min(index, moves.length) - 1]?.fen ?? startFen;
}

/**
 * Return { from, to } squares for the last move at the given index.
 * Returns null if at starting position.
 */
export function lastMoveSquares(
    moves: ParsedMove[],
    index: number,
): { from: string; to: string } | null {
    if (index === 0 || moves.length === 0) return null;
    const move = moves[Math.min(index, moves.length) - 1];
    return move ? { from: move.from, to: move.to } : null;
}

/**
 * Build square styles object for last-move highlight.
 */
export function buildLastMoveStyles(
    moves: ParsedMove[],
    index: number,
    color = 'rgba(255, 213, 0, 0.45)',
): Record<string, React.CSSProperties> {
    const sq = lastMoveSquares(moves, index);
    if (!sq) return {};
    return {
        [sq.from]: { backgroundColor: color },
        [sq.to]: { backgroundColor: color },
    };
}

/**
 * Get whose turn it is at a given move index.
 */
export function turnAtIndex(moves: ParsedMove[], index: number): 'w' | 'b' {
    return index % 2 === 0 ? 'w' : 'b';
}

/**
 * Check if a move (by square pair) matches the expected next move in a variation.
 * Used by the move trainer.
 */
export function isCorrectMove(
    moves: ParsedMove[],
    currentIndex: number,
    fromSquare: string,
    toSquare: string,
): boolean {
    const expected = moves[currentIndex];
    if (!expected) return false;
    return expected.from === fromSquare && expected.to === toSquare;
}

// Add this to your existing utils file
export function getPgnData(pgn: string) {
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);

        return {
            headers: chess.header(),
            moves: chess.history({ verbose: true }),
            error: null,
        };
    } catch (e) {
        return {
            headers: null,
            moves: [],
            error: (e as Error).message,
        };
    }
}

export function validatePgn(pgn: string): string | null {
    return getPgnData(pgn).error;
}

export function parsePgnHeaders(pgn: string): Partial<ChessGame> {
    const { headers } = getPgnData(pgn);
    if (!headers) return { white: 'White', black: 'Black' };
    const get = (key: string) => headers[key] ?? null;
    return {
        white: get('White') || 'White',
        black: get('Black') || 'Black',
        result: get('Result'),
        event: get('Event'),
        site: get('Site'),
        played_at:
            get('Date')?.replace(/\./g, '-').replace(/\?/g, '01') ?? null,
    };
}

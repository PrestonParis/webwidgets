import { describe, it, expect } from 'vitest';
import {
    parsePgn,
    parsePgnFromFen,
    fenAtIndex,
    lastMoveSquares,
    buildLastMoveStyles,
    isCorrectMove,
    validatePgn,
    parsePgnHeaders,
    extendPgn,
} from '@/features/chess/lib/chessUtils';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const SAMPLE_PGN = `[Event "Test"]
[White "Magnus"]
[Black "Hikaru"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`;

describe('parsePgn', () => {
    it('returns an array of moves for valid PGN', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(moves).toHaveLength(4);
    });

    it('each move has san, from, to, and fen fields', () => {
        const moves = parsePgn(SAMPLE_PGN);
        const first = moves[0]!;
        expect(first).toHaveProperty('san');
        expect(first).toHaveProperty('from');
        expect(first).toHaveProperty('to');
        expect(first).toHaveProperty('fen');
    });

    it('captures the first move as e4 (e2→e4)', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(moves[0]?.san).toBe('e4');
        expect(moves[0]?.from).toBe('e2');
        expect(moves[0]?.to).toBe('e4');
    });

    it('returns [] for invalid PGN', () => {
        expect(parsePgn('not pgn at all %%')).toEqual([]);
    });

    it('returns [] for empty string', () => {
        expect(parsePgn('')).toEqual([]);
    });
});

describe('parsePgnFromFen', () => {
    it('parses moves relative to a given start FEN', () => {
        const fen =
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const moves = parsePgnFromFen('1... e5', fen);
        expect(moves).toHaveLength(1);
        expect(moves[0]?.san).toBe('e5');
    });

    it('stops on an invalid move', () => {
        const moves = parsePgnFromFen('1. Qh6 Qh3', STARTING_FEN);
        expect(moves).toHaveLength(0);
    });
});

describe('fenAtIndex', () => {
    it('returns starting FEN at index 0', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(fenAtIndex(moves, 0)).toBe(STARTING_FEN);
    });

    it('returns the FEN after the first move at index 1', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(fenAtIndex(moves, 1)).toBe(moves[0]?.fen);
    });

    it('clamps to the last move when index exceeds length', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(fenAtIndex(moves, 999)).toBe(moves[moves.length - 1]?.fen);
    });

    it('returns startFen for empty moves array', () => {
        expect(fenAtIndex([], 5)).toBe(STARTING_FEN);
    });

    it('accepts a custom startFen', () => {
        const customFen =
            'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
        expect(fenAtIndex([], 0, customFen)).toBe(customFen);
    });
});

describe('lastMoveSquares', () => {
    it('returns null at index 0', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(lastMoveSquares(moves, 0)).toBeNull();
    });

    it('returns null for empty moves array', () => {
        expect(lastMoveSquares([], 3)).toBeNull();
    });

    it('returns from/to for a valid move index', () => {
        const moves = parsePgn(SAMPLE_PGN);
        const sq = lastMoveSquares(moves, 1);
        expect(sq).toEqual({ from: 'e2', to: 'e4' });
    });
});

describe('buildLastMoveStyles', () => {
    it('returns empty object at index 0', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(buildLastMoveStyles(moves, 0)).toEqual({});
    });

    it('highlights from and to squares with default color', () => {
        const moves = parsePgn(SAMPLE_PGN);
        const styles = buildLastMoveStyles(moves, 1);
        expect(styles['e2']).toEqual({
            backgroundColor: 'rgba(255, 213, 0, 0.45)',
        });
        expect(styles['e4']).toEqual({
            backgroundColor: 'rgba(255, 213, 0, 0.45)',
        });
    });

    it('uses a custom color when provided', () => {
        const moves = parsePgn(SAMPLE_PGN);
        const styles = buildLastMoveStyles(moves, 1, 'red');
        expect(styles['e4']).toEqual({ backgroundColor: 'red' });
    });
});

describe('isCorrectMove', () => {
    it('returns true when from/to matches the expected move', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(isCorrectMove(moves, 0, 'e2', 'e4')).toBe(true);
    });

    it('returns false when from is wrong', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(isCorrectMove(moves, 0, 'd2', 'e4')).toBe(false);
    });

    it('returns false when index is out of range', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(isCorrectMove(moves, 999, 'e2', 'e4')).toBe(false);
    });
});

describe('validatePgn', () => {
    it('returns null for valid PGN', () => {
        expect(validatePgn(SAMPLE_PGN)).toBeNull();
    });

    it('returns an error string for invalid PGN', () => {
        const err = validatePgn('garbage input %%');
        expect(typeof err).toBe('string');
        expect(err!.length).toBeGreaterThan(0);
    });
});

describe('parsePgnHeaders', () => {
    it('extracts White and Black player names', () => {
        const headers = parsePgnHeaders(SAMPLE_PGN);
        expect(headers.white).toBe('Magnus');
        expect(headers.black).toBe('Hikaru');
    });

    it('extracts the result', () => {
        const headers = parsePgnHeaders(SAMPLE_PGN);
        expect(headers.result).toBe('1-0');
    });

    it('uses chess.js default "?" when player names are not specified', () => {
        // chess.js fills in "?" for missing White/Black headers, which is truthy,
        // so the || 'White' fallback only fires for null/undefined/empty string.
        const headers = parsePgnHeaders('1. e4 e5 *');
        expect(headers.white).toBe('?');
        expect(headers.black).toBe('?');
    });
});

describe('extendPgn', () => {
    it('returns a PGN string when extension succeeds', () => {
        const moves = parsePgn(SAMPLE_PGN);
        const result = extendPgn(moves, 2, 'Nf3');
        expect(typeof result).toBe('string');
        expect(result).toContain('Nf3');
    });

    it('returns empty string for an illegal move', () => {
        const moves = parsePgn(SAMPLE_PGN);
        expect(extendPgn(moves, 0, 'Qh5')).toBe('');
    });
});

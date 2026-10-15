import { describe, expect, it } from 'vitest';
import { rowsToCSV } from '@/features/import-export/lib/csvSerialization';

describe('rowsToCSV', () => {
    it('escapes delimiters, quotes, and newlines', () => {
        expect(
            rowsToCSV([
                {
                    data: {
                        title: 'one, two',
                        note: 'say "hello"\nnext',
                    },
                },
            ]),
        ).toBe('title,note\n"one, two","say ""hello""\nnext"');
    });

    it('serializes structured values instead of using object coercion', () => {
        expect(
            rowsToCSV([
                {
                    data: {
                        metadata: { active: true },
                        tags: ['one', 'two'],
                        empty: null,
                    },
                },
            ]),
        ).toBe('metadata,tags,empty\n"{""active"":true}","[""one"",""two""]",');
    });

    it('marks circular values without failing the export', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(rowsToCSV([{ data: { circular } }])).toBe(
            'circular\n[unserializable]',
        );
    });
});

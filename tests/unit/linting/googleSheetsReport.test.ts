import { describe, expect, it } from 'vitest';
import { buildReportRows } from '../../../scripts/linting/googleSheetsReport';

const context = {
    branch: 'main',
    commitSha: 'abc123',
    runAt: '2026-09-07T03:00:00.000Z',
    runId: '42',
    workflowRunUrl: 'https://github.com/example/repo/actions/runs/42',
};

const baseReport = {
    durationMs: 10,
    generatedAt: '2026-09-07T03:00:00.000Z',
    status: 'pass' as const,
};

function inputs() {
    return {
        lint: {
            ...baseReport,
            errors: 1,
            filesChecked: 12,
            results: [
                {
                    column: 4,
                    file: 'apps/web/example.ts',
                    line: 3,
                    message: '=not a formula',
                    rule: 'example/rule',
                    severity: 'error',
                },
            ],
            status: 'fail',
            warnings: 2,
        },
        smells: {
            ...baseReport,
            consoleLogCount: 2,
            results: [
                {
                    detail: 'example — 101 lines',
                    file: 'apps/web/example.ts',
                    line: 1,
                    rule: 'long-function',
                },
            ],
            todoCount: 3,
            totalSmells: 4,
        },
        stats: {
            ...baseReport,
            averageLinesPerFile: 10,
            byExtension: {
                '.ts': { files: 8, lines: 80 },
                '.tsx': { files: 2, lines: 20 },
            },
            fileCount: 10,
            largestFiles: [{ file: 'apps/web/example.ts', lines: 101 }],
            totalLines: 100,
        },
        ts: {
            ...baseReport,
            errors: 1,
            results: [
                {
                    errorCount: 1,
                    errors: [
                        {
                            code: 'TS2322',
                            file: 'apps/web/example.ts',
                            line: 3,
                            message: 'Type mismatch',
                        },
                    ],
                    project: 'apps/web/tsconfig.json',
                },
            ],
            status: 'fail',
        },
    };
}

describe('buildReportRows', () => {
    it('creates summary and detailed rows with a shared run identity', () => {
        const rows = buildReportRows(inputs(), context);

        expect(rows.daily[0]).toEqual([
            '42',
            context.runAt,
            'main',
            'abc123',
            'fail',
            1,
            2,
            1,
            4,
            3,
            2,
            12,
            100,
            40,
            context.workflowRunUrl,
        ]);
        expect(rows.lint[0]?.slice(0, 3)).toEqual([
            '42',
            context.runAt,
            'apps/web/example.ts',
        ]);
        expect(rows.ts[0]?.slice(0, 4)).toEqual([
            '42',
            context.runAt,
            'apps/web/tsconfig.json',
            'apps/web/example.ts',
        ]);
        expect(rows.smells[0]?.slice(0, 3)).toEqual([
            '42',
            context.runAt,
            'apps/web/example.ts',
        ]);
        expect(rows.stats[0]?.slice(2, 9)).toEqual([10, 100, 10, 8, 80, 2, 20]);
    });

    it('rejects malformed report input before publishing', () => {
        const malformed = inputs();
        malformed.lint.errors = -1;

        expect(() => buildReportRows(malformed, context)).toThrow();
    });
});

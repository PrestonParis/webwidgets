import { relative } from 'node:path';
import { ROOT } from './lib/paths';
import { countLines, fileSizeBytes } from './lib/fsWalk';
import { markdownTable, writeReport } from './lib/report';
import { collectFiles } from './lib/scope';
import { phaseResult, phaseStart } from './lib/terminal';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export interface StatsPhaseResult {
    fileCount: number;
    durationMs: number;
}

export function runStatsPhase(scopes: string[]): StatsPhaseResult {
    const startedAt = performance.now();
    phaseStart('Repository stats', 'advisory');
    const defaultScopes = [
        'apps/web',
        'services/sync-worker',
        'services/conversion',
        'scripts',
    ];
    const files = collectFiles(
        scopes.length === 0 ? defaultScopes : scopes,
        EXTENSIONS,
    );

    const byExtension = new Map<string, { files: number; lines: number }>();
    let totalLines = 0;
    const sized = files.map((file) => {
        const lines = countLines(file);
        totalLines += lines;
        const ext = file.slice(file.lastIndexOf('.'));
        const bucket = byExtension.get(ext) ?? { files: 0, lines: 0 };
        bucket.files += 1;
        bucket.lines += lines;
        byExtension.set(ext, bucket);
        return { file, lines, bytes: fileSizeBytes(file) };
    });

    const largest = [...sized]
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 20)
        .map((f) => ({ file: relative(ROOT, f.file), lines: f.lines }));

    const generatedAt = new Date().toISOString();
    const durationMs = performance.now() - startedAt;

    writeReport(
        'stats',
        {
            phase: 'stats',
            status: 'pass',
            generatedAt,
            durationMs,
            scopes,
            fileCount: files.length,
            totalLines,
            averageLinesPerFile: files.length
                ? Math.round(totalLines / files.length)
                : 0,
            byExtension: Object.fromEntries(byExtension),
            largestFiles: largest,
        },
        [
            `# Repo stats report — ${generatedAt.slice(0, 10)}`,
            '',
            `- Generated: ${generatedAt}`,
            `- Duration: ${Math.round(durationMs)}ms`,
            `- Files: ${files.length}`,
            `- Total lines: ${totalLines}`,
            `- Average lines/file: ${files.length ? Math.round(totalLines / files.length) : 0}`,
            '',
            '## By extension',
            '',
            ...markdownTable(
                ['Extension', 'Files', 'Lines'],
                [...byExtension.entries()].map(([ext, b]) => [
                    ext,
                    b.files,
                    b.lines,
                ]),
            ),
            '',
            '## Largest files',
            '',
            ...markdownTable(
                ['File', 'Lines'],
                largest.map((f) => [f.file, f.lines]),
            ),
        ],
    );

    phaseResult(
        'Repository stats',
        'pass',
        `${files.length} files · ${totalLines} lines`,
        durationMs,
    );
    return { fileCount: files.length, durationMs };
}

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ROOT } from './lib/paths';
import { markdownTable, writeReport } from './lib/report';
import { collectFiles } from './lib/scope';
import { phaseResult, phaseStart, progress } from './lib/terminal';

interface EslintMessage {
    column: number;
    line: number;
    message: string;
    ruleId: string | null;
    severity: 1 | 2;
}

interface EslintResult {
    filePath: string;
    messages: EslintMessage[];
    errorCount: number;
    warningCount: number;
    fixableErrorCount: number;
    fixableWarningCount: number;
}

interface LintBatch {
    files: string[];
    label: string;
}

export interface LintPhaseResult {
    errors: number;
    warnings: number;
    durationMs: number;
}

export interface LintPhaseOptions {
    batchSize?: number;
    cache?: boolean;
    scopes: string[];
}

const LINT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const DEFAULT_BATCH_SIZE = 200;
const MAX_SPLIT_DEPTH = 4;

function splitIntoBatches<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let offset = 0; offset < items.length; offset += size) {
        batches.push(items.slice(offset, offset + size));
    }
    return batches;
}

function fileOwner(file: string): string {
    if (file.startsWith('apps/web/')) return 'web';
    if (file.startsWith('services/conversion/')) return 'conversion';
    if (file.startsWith('services/sync-worker/')) return 'sync-worker';
    return 'root';
}

function createBatches(files: string[], size: number): LintBatch[] {
    const byOwner = new Map<string, string[]>();
    for (const file of files) {
        const owner = fileOwner(file);
        const ownedFiles = byOwner.get(owner) ?? [];
        ownedFiles.push(file);
        byOwner.set(owner, ownedFiles);
    }
    return [...byOwner.entries()].flatMap(([owner, ownedFiles]) => {
        const batches = splitIntoBatches(ownedFiles, size);
        return batches.map((batch, index) => ({
            files: batch,
            label: `${owner} ${index + 1}/${batches.length}`,
        }));
    });
}

function eslintArgs(files: string[], cache: boolean): string[] {
    const args = [...files, '--format', 'json'];
    if (cache) {
        args.push(
            '--cache',
            '--cache-strategy',
            'content',
            '--cache-location',
            '.cache/eslint/.eslintcache',
        );
    }
    return args;
}

function parseResults(
    stdout: string,
    label: string,
    status: number | null,
): EslintResult[] {
    if (stdout.trim().length === 0) {
        throw new Error(
            `eslint produced no output for ${label} (exit ${status})`,
        );
    }
    try {
        return JSON.parse(stdout) as EslintResult[];
    } catch {
        throw new Error(
            `eslint did not return valid JSON for ${label} (exit ${status})`,
        );
    }
}

function lintBatch(
    eslintBin: string,
    files: string[],
    cache: boolean,
    label: string,
    depth = 0,
): EslintResult[] {
    const run = spawnSync(eslintBin, eslintArgs(files, cache), {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
    });
    if (run.error)
        throw new Error(
            `eslint failed to start for ${label}: ${run.error.message}`,
        );
    if (!run.signal) return parseResults(run.stdout ?? '', label, run.status);
    if (depth >= MAX_SPLIT_DEPTH || files.length === 1) {
        const diagnostic = (run.stderr ?? '').trim().slice(-2_000);
        throw new Error(
            `eslint crashed with ${run.signal} for ${label}${diagnostic ? `\n${diagnostic}` : ''}`,
        );
    }
    const midpoint = Math.ceil(files.length / 2);
    progress(
        `${label} hit ${run.signal}; retrying as ${midpoint} + ${files.length - midpoint} files`,
    );
    return [
        ...lintBatch(
            eslintBin,
            files.slice(0, midpoint),
            cache,
            `${label}.1`,
            depth + 1,
        ),
        ...lintBatch(
            eslintBin,
            files.slice(midpoint),
            cache,
            `${label}.2`,
            depth + 1,
        ),
    ];
}

function lintFiles(options: LintPhaseOptions): EslintResult[] {
    const cache = options.cache !== false;
    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const absoluteFiles = collectFiles(options.scopes, LINT_EXTENSIONS);
    if (options.scopes.length === 0)
        absoluteFiles.push(join(ROOT, 'eslint.config.mjs'));
    const files = [
        ...new Set(absoluteFiles.map((file) => relative(ROOT, file))),
    ].sort();
    const batches = createBatches(files, batchSize);
    const eslintBin = join(ROOT, 'node_modules', '.bin', 'eslint');
    if (cache)
        mkdirSync(dirname(join(ROOT, '.cache/eslint/.eslintcache')), {
            recursive: true,
        });
    return batches.flatMap((batch, index) => {
        const label = `${batch.label} · batch ${index + 1}/${batches.length}`;
        const startedAt = performance.now();
        progress(`${label} · ${batch.files.length} files`);
        const results = lintBatch(eslintBin, batch.files, cache, label);
        progress(
            `${label} complete · ${Math.round(performance.now() - startedAt)}ms`,
        );
        return results;
    });
}

export function runLintPhase(options: LintPhaseOptions): LintPhaseResult {
    const startedAt = performance.now();
    phaseStart(
        'ESLint',
        options.cache === false ? 'cache disabled' : 'content cache enabled',
    );
    const results = lintFiles(options);
    const filesWithIssues = results.filter(
        (result) => result.messages.length > 0,
    );
    const errors = results.reduce((sum, result) => sum + result.errorCount, 0);
    const warnings = results.reduce(
        (sum, result) => sum + result.warningCount,
        0,
    );
    const fixableErrors = results.reduce(
        (sum, result) => sum + result.fixableErrorCount,
        0,
    );
    const fixableWarnings = results.reduce(
        (sum, result) => sum + result.fixableWarningCount,
        0,
    );
    const ruleCounts = new Map<string, number>();
    for (const result of results) {
        for (const message of result.messages) {
            const rule = message.ruleId ?? 'configuration';
            ruleCounts.set(rule, (ruleCounts.get(rule) ?? 0) + 1);
        }
    }
    const topRules = [...ruleCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const findings = results.flatMap((result) =>
        result.messages.map((message) => ({
            file: relative(ROOT, result.filePath),
            line: message.line,
            column: message.column,
            severity: message.severity === 2 ? 'error' : 'warning',
            rule: message.ruleId ?? 'configuration',
            message: message.message,
        })),
    );
    const generatedAt = new Date().toISOString();
    const durationMs = performance.now() - startedAt;
    const status = errors === 0 ? 'pass' : 'fail';
    writeReport(
        'lint',
        {
            phase: 'lint',
            status,
            generatedAt,
            durationMs,
            filesChecked: results.length,
            filesWithIssues: filesWithIssues.length,
            errors,
            warnings,
            fixableErrors,
            fixableWarnings,
            scopes: options.scopes,
            topRules: topRules.map(([rule, count]) => ({ rule, count })),
            results: findings,
        },
        [
            `# Lint report — ${generatedAt.slice(0, 10)}`,
            '',
            `- Status: ${status.toUpperCase()}`,
            `- Duration: ${Math.round(durationMs)}ms`,
            `- Files checked: ${results.length}`,
            `- Files with issues: ${filesWithIssues.length}`,
            `- Errors: ${errors}`,
            `- Warnings: ${warnings}`,
            `- Automatically fixable: ${fixableErrors + fixableWarnings}`,
            '',
            '## Top rules',
            '',
            ...markdownTable(['Rule', 'Count'], topRules),
            '',
            '## Findings',
            '',
            ...findings.map(
                (finding) =>
                    `- [${finding.severity.toUpperCase()}] \`${finding.file}:${finding.line}:${finding.column}\` **${finding.rule}** ${finding.message}`,
            ),
        ],
    );
    phaseResult(
        'ESLint',
        errors > 0 ? 'fail' : warnings > 0 ? 'warn' : 'pass',
        `${results.length} files · ${errors} errors · ${warnings} warnings`,
        durationMs,
    );
    return { errors, warnings, durationMs };
}

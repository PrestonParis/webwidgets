import { z } from 'zod';

const baseReportSchema = z.object({
    durationMs: z.number().nonnegative(),
    generatedAt: z.string().datetime(),
    status: z.enum(['pass', 'fail']),
});

const lintReportSchema = baseReportSchema.extend({
    errors: z.number().int().nonnegative(),
    filesChecked: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            column: z.number().int().nonnegative(),
            file: z.string(),
            line: z.number().int().nonnegative(),
            message: z.string(),
            rule: z.string(),
            severity: z.enum(['error', 'warning']),
        }),
    ),
    warnings: z.number().int().nonnegative(),
});

const tsReportSchema = baseReportSchema.extend({
    errors: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            errorCount: z.number().int().nonnegative(),
            errors: z.array(
                z.object({
                    code: z.string(),
                    file: z.string(),
                    line: z.number().int().nonnegative(),
                    message: z.string(),
                }),
            ),
            project: z.string(),
        }),
    ),
});

const smellsReportSchema = baseReportSchema.extend({
    consoleLogCount: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            detail: z.string(),
            file: z.string(),
            line: z.number().int().nonnegative(),
            rule: z.string(),
        }),
    ),
    todoCount: z.number().int().nonnegative(),
    totalSmells: z.number().int().nonnegative(),
});

const extensionStatsSchema = z.object({
    files: z.number().int().nonnegative(),
    lines: z.number().int().nonnegative(),
});

const statsReportSchema = baseReportSchema.extend({
    averageLinesPerFile: z.number().int().nonnegative(),
    byExtension: z.record(z.string(), extensionStatsSchema),
    fileCount: z.number().int().nonnegative(),
    largestFiles: z.array(
        z.object({
            file: z.string(),
            lines: z.number().int().nonnegative(),
        }),
    ),
    totalLines: z.number().int().nonnegative(),
});

export const REPORT_SHEETS = {
    daily: {
        title: 'Daily Runs',
        headers: [
            'Run ID',
            'Run At',
            'Branch',
            'Commit SHA',
            'Overall Status',
            'ESLint Errors',
            'ESLint Warnings',
            'TypeScript Errors',
            'Code Smells',
            'TODOs',
            'Console Logs',
            'Files Checked',
            'Total Lines',
            'Duration ms',
            'Workflow Run',
        ],
    },
    lint: {
        title: 'Lint Findings',
        headers: [
            'Run ID',
            'Run At',
            'File',
            'Line',
            'Column',
            'Severity',
            'Rule',
            'Message',
        ],
    },
    ts: {
        title: 'TypeScript Findings',
        headers: [
            'Run ID',
            'Run At',
            'Project',
            'File',
            'Line',
            'Code',
            'Message',
        ],
    },
    smells: {
        title: 'Code Smells',
        headers: ['Run ID', 'Run At', 'File', 'Line', 'Rule', 'Detail'],
    },
    stats: {
        title: 'Repository Stats',
        headers: [
            'Run ID',
            'Run At',
            'File Count',
            'Total Lines',
            'Average Lines/File',
            'TS Files',
            'TS Lines',
            'TSX Files',
            'TSX Lines',
            'Largest Files',
        ],
    },
} as const;

export type SheetValue = string | number | boolean;

export interface ReportInputs {
    lint: unknown;
    smells: unknown;
    stats: unknown;
    ts: unknown;
}

export interface RunContext {
    branch: string;
    commitSha: string;
    runAt: string;
    runId: string;
    workflowRunUrl: string;
}

export interface ReportRows {
    daily: SheetValue[][];
    lint: SheetValue[][];
    smells: SheetValue[][];
    stats: SheetValue[][];
    ts: SheetValue[][];
}

export function buildReportRows(
    inputs: ReportInputs,
    context: RunContext,
): ReportRows {
    const lint = lintReportSchema.parse(inputs.lint);
    const ts = tsReportSchema.parse(inputs.ts);
    const smells = smellsReportSchema.parse(inputs.smells);
    const stats = statsReportSchema.parse(inputs.stats);
    const tsExtension = stats.byExtension['.ts'] ?? { files: 0, lines: 0 };
    const tsxExtension = stats.byExtension['.tsx'] ?? { files: 0, lines: 0 };
    const durationMs = Math.round(
        lint.durationMs + ts.durationMs + smells.durationMs + stats.durationMs,
    );
    const common = [context.runId, context.runAt] satisfies SheetValue[];

    return {
        daily: [
            [
                ...common,
                context.branch,
                context.commitSha,
                lint.status === 'pass' && ts.status === 'pass'
                    ? 'pass'
                    : 'fail',
                lint.errors,
                lint.warnings,
                ts.errors,
                smells.totalSmells,
                smells.todoCount,
                smells.consoleLogCount,
                lint.filesChecked,
                stats.totalLines,
                durationMs,
                context.workflowRunUrl,
            ],
        ],
        lint: lint.results.map((finding) => [
            ...common,
            finding.file,
            finding.line,
            finding.column,
            finding.severity,
            finding.rule,
            finding.message,
        ]),
        smells: smells.results.map((finding) => [
            ...common,
            finding.file,
            finding.line,
            finding.rule,
            finding.detail,
        ]),
        stats: [
            [
                ...common,
                stats.fileCount,
                stats.totalLines,
                stats.averageLinesPerFile,
                tsExtension.files,
                tsExtension.lines,
                tsxExtension.files,
                tsxExtension.lines,
                JSON.stringify(stats.largestFiles),
            ],
        ],
        ts: ts.results.flatMap((project) =>
            project.errors.map((error) => [
                ...common,
                project.project,
                error.file,
                error.line,
                error.code,
                error.message,
            ]),
        ),
    };
}

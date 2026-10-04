import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
    CONVERSION_TS_PROJECT,
    ROOT,
    ROOT_TS_PROJECT,
    SYNC_TS_PROJECT,
    TS_PROJECTS,
    WEB_TS_PROJECT,
} from './lib/paths';
import { markdownTable, writeReport } from './lib/report';
import { phaseResult, phaseStart, progress } from './lib/terminal';

const TS_ERROR_LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

interface ProjectResult {
    project: string;
    errorCount: number;
    errors: Array<{
        file: string;
        line: number;
        code: string;
        message: string;
    }>;
}

export interface TsPhaseResult {
    errors: number;
    durationMs: number;
}

function projectsForScopes(scopes: string[]): string[] {
    if (scopes.length === 0) return TS_PROJECTS;
    const selected = new Set<string>();
    for (const scope of scopes) {
        if (scope === 'apps/web' || scope.startsWith('apps/web/'))
            selected.add(WEB_TS_PROJECT);
        else if (
            scope === 'services/sync-worker' ||
            scope.startsWith('services/sync-worker/')
        ) {
            selected.add(SYNC_TS_PROJECT);
        } else if (
            scope === 'services/conversion' ||
            scope.startsWith('services/conversion/')
        ) {
            selected.add(CONVERSION_TS_PROJECT);
        } else selected.add(ROOT_TS_PROJECT);
    }
    return TS_PROJECTS.filter((project) => selected.has(project));
}

function projectCachePath(project: string): string {
    const name = relative(ROOT, project)
        .replaceAll('/', '-')
        .replace('.json', '');
    return join(ROOT, '.cache', 'typecheck', `${name}.tsbuildinfo`);
}

function runTypecheckProject(
    tscBin: string,
    project: string,
    cache: boolean,
): ProjectResult {
    const projectName = relative(ROOT, project);
    progress(projectName);
    const args = ['--noEmit', '--pretty', 'false', '-p', project];
    if (cache) {
        const cachePath = projectCachePath(project);
        mkdirSync(join(ROOT, '.cache', 'typecheck'), { recursive: true });
        args.push('--incremental', '--tsBuildInfoFile', cachePath);
    }
    const run = spawnSync(tscBin, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
    });
    if (run.error) {
        throw new Error(
            `tsc failed to start for ${project}: ${run.error.message}`,
        );
    }
    const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;
    const errors = output
        .split('\n')
        .map((line) => line.match(TS_ERROR_LINE))
        .filter((match): match is RegExpMatchArray => match !== null)
        .map((match) => ({
            file: relative(ROOT, match[1] ?? ''),
            line: Number(match[2] ?? '0'),
            code: match[4] ?? '',
            message: match[5] ?? '',
        }));
    return { project: projectName, errorCount: errors.length, errors };
}

export function runTsPhase(scopes: string[], cache = true): TsPhaseResult {
    const startedAt = performance.now();
    const projects = projectsForScopes(scopes);
    phaseStart(
        'TypeScript',
        `${projects.length} project${projects.length === 1 ? '' : 's'}`,
    );
    const tscBin = join(ROOT, 'node_modules', '.bin', 'tsc');
    const projectResults = projects.map((project) =>
        runTypecheckProject(tscBin, project, cache),
    );

    const totalErrors = projectResults.reduce(
        (sum, p) => sum + p.errorCount,
        0,
    );
    const generatedAt = new Date().toISOString();
    const durationMs = performance.now() - startedAt;
    const status: 'pass' | 'fail' = totalErrors === 0 ? 'pass' : 'fail';

    writeReport(
        'ts',
        {
            phase: 'ts',
            status,
            generatedAt,
            durationMs,
            scopes,
            errors: totalErrors,
            projects: projectResults.map((p) => ({
                project: p.project,
                errorCount: p.errorCount,
            })),
            results: projectResults,
        },
        [
            `# TypeScript report — ${generatedAt.slice(0, 10)}`,
            '',
            `- Status: ${status.toUpperCase()}`,
            `- Generated: ${generatedAt}`,
            `- Duration: ${Math.round(durationMs)}ms`,
            `- Total errors: ${totalErrors}`,
            '',
            '## Per project',
            '',
            ...markdownTable(
                ['Project', 'Errors'],
                projectResults.map((p) => [p.project, p.errorCount]),
            ),
            '',
            '## Errors',
            '',
            ...(totalErrors === 0
                ? ['_None found._']
                : projectResults
                      .flatMap((p) => p.errors)
                      .slice(0, 200)
                      .map(
                          (e) =>
                              `- \`${e.file}:${e.line}\` **${e.code}** ${e.message}`,
                      )),
        ],
    );

    phaseResult(
        'TypeScript',
        status,
        `${totalErrors} errors · ${projectResults.length} projects`,
        durationMs,
    );
    return { errors: totalErrors, durationMs };
}

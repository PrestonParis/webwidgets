import fs from 'node:fs';

import { runCommand } from './command';
import type { DispatcherConfig } from './types';

export interface PreflightCheck {
    name: string;
    ok: boolean;
    detail: string;
}

async function commandCheck(
    config: DispatcherConfig,
    name: string,
    command: string,
    args: string[],
): Promise<PreflightCheck> {
    try {
        const result = await runCommand(command, args, {
            cwd: config.repoRoot,
            timeoutMs: 15_000,
        });
        const detail =
            (result.stdout || result.stderr).trim().split('\n')[0] ?? '';
        return { name, ok: result.exitCode === 0, detail };
    } catch (error) {
        return {
            name,
            ok: false,
            detail: error instanceof Error ? error.message : String(error),
        };
    }
}

async function labelCheck(config: DispatcherConfig): Promise<PreflightCheck> {
    const result = await runCommand(
        'gh',
        [
            'label',
            'list',
            '--repo',
            config.repository,
            '--limit',
            '100',
            '--json',
            'name',
        ],
        { cwd: config.repoRoot, timeoutMs: 15_000 },
    );
    if (result.exitCode !== 0)
        return {
            name: 'queue labels',
            ok: false,
            detail: result.stderr.trim(),
        };
    const labels = new Set(
        (JSON.parse(result.stdout) as Array<{ name: string }>).map(
            ({ name }) => name,
        ),
    );
    const missing = [config.approvalLabel, config.claimedLabel].filter(
        (label) => !labels.has(label),
    );
    return {
        name: 'queue labels',
        ok: missing.length === 0,
        detail:
            missing.length === 0
                ? 'configured'
                : `missing: ${missing.join(', ')}`,
    };
}

export async function runPreflight(
    config: DispatcherConfig,
): Promise<PreflightCheck[]> {
    const checks = await Promise.all([
        commandCheck(config, 'git', 'git', ['rev-parse', '--show-toplevel']),
        commandCheck(config, 'gh auth', 'gh', ['auth', 'status']),
        commandCheck(config, 'Claude Code', config.claudeBin, ['--version']),
        labelCheck(config),
    ]);
    checks.push({
        name: 'AGENTS.md',
        ok: fs.existsSync(`${config.repoRoot}/AGENTS.md`),
        detail: `${config.repoRoot}/AGENTS.md`,
    });
    return checks;
}

import fs from 'node:fs';
import path from 'node:path';

import type { DispatchRun, DispatcherConfig } from './types';

export function ensureStateDirs(config: DispatcherConfig): void {
    fs.mkdirSync(path.join(config.stateDir, 'runs'), { recursive: true });
    fs.mkdirSync(config.worktreeRoot, { recursive: true });
}

export function acquireDispatcherLock(config: DispatcherConfig): () => void {
    ensureStateDirs(config);
    const lockPath = path.join(config.stateDir, 'dispatcher.lock');
    const descriptor = fs.openSync(lockPath, 'wx');
    fs.writeFileSync(descriptor, `${String(process.pid)}\n`, 'utf8');
    return () => {
        fs.closeSync(descriptor);
        fs.rmSync(lockPath, { force: true });
    };
}

export function saveRun(config: DispatcherConfig, run: DispatchRun): void {
    ensureStateDirs(config);
    const target = path.join(config.stateDir, 'runs', `${run.id}.json`);
    fs.writeFileSync(target, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
    fs.writeFileSync(
        path.join(config.stateDir, 'latest.json'),
        `${JSON.stringify(run, null, 2)}\n`,
    );
}

export function loadLatestRun(
    config: DispatcherConfig,
): DispatchRun | undefined {
    const target = path.join(config.stateDir, 'latest.json');
    if (!fs.existsSync(target)) return undefined;
    return JSON.parse(fs.readFileSync(target, 'utf8')) as DispatchRun;
}

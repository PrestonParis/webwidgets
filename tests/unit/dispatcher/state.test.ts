import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadConfig } from '../../../tools/claude-dispatcher/config';
import {
    acquireDispatcherLock,
    loadLatestRun,
    saveRun,
} from '../../../tools/claude-dispatcher/state';
import type { DispatchRun } from '../../../tools/claude-dispatcher/types';

const temporaryDirectories: string[] = [];

function temporaryConfig() {
    const root = fs.mkdtempSync(
        path.join(os.tmpdir(), 'webwidgets-dispatcher-'),
    );
    temporaryDirectories.push(root);
    return loadConfig(root, {});
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe('dispatcher state', () => {
    it('allows only one local dispatcher lock holder', () => {
        const config = temporaryConfig();
        const release = acquireDispatcherLock(config);
        expect(() => acquireDispatcherLock(config)).toThrow();
        release();
        const releaseAgain = acquireDispatcherLock(config);
        releaseAgain();
    });

    it('persists and reloads the latest run', () => {
        const config = temporaryConfig();
        const run: DispatchRun = {
            id: '20-test',
            issueNumber: 20,
            issueTitle: 'Test issue',
            issueUrl: 'https://github.com/PrestonParis/aidash/issues/20',
            branch: 'agent/claude/20-test',
            worktree: '/tmp/worktree',
            status: 'running',
            startedAt: '2026-08-12T00:00:00Z',
            updatedAt: '2026-08-12T00:00:00Z',
        };
        saveRun(config, run);
        expect(loadLatestRun(config)).toEqual(run);
    });
});

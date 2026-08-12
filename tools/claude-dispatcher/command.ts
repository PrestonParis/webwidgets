import { spawn } from 'node:child_process';

import type { CommandResult } from './types';

export interface RunCommandOptions {
    cwd: string;
    timeoutMs?: number;
    stdin?: string;
    stream?: boolean;
}

export function runCommand(
    command: string,
    args: string[],
    options: RunCommandOptions,
): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        const timer = options.timeoutMs
            ? setTimeout(() => child.kill('SIGTERM'), options.timeoutMs)
            : undefined;

        child.stdout.on('data', (chunk: Buffer) => {
            const value = chunk.toString();
            stdout += value;
            if (options.stream) process.stdout.write(value);
        });
        child.stderr.on('data', (chunk: Buffer) => {
            const value = chunk.toString();
            stderr += value;
            if (options.stream) process.stderr.write(value);
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (timer) clearTimeout(timer);
            resolve({ exitCode: code ?? 1, stdout, stderr });
        });
        if (options.stdin) child.stdin.end(options.stdin);
        else child.stdin.end();
    });
}

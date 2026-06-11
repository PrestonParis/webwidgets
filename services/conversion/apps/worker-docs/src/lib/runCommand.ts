import { spawn } from 'node:child_process';

export interface RunCommandResult {
    stdout: string;
    stderr: string;
}

export function runCommand(
    command: string,
    args: string[],
    options: { cwd?: string; timeoutMs: number },
): Promise<RunCommandResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            reject(
                new Error(`${command} timed out after ${options.timeoutMs}ms.`),
            );
        }, options.timeoutMs);

        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            stdout += chunk;
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk;
        });
        child.on('error', (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                resolve({ stdout, stderr });
                return;
            }
            reject(
                new Error(
                    `${command} exited with code ${code ?? 'unknown'}: ${stderr}`,
                ),
            );
        });
    });
}

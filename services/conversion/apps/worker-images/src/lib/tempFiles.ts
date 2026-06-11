import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function withTempDir<T>(
    name: string,
    fn: (dir: string) => Promise<T>,
): Promise<T> {
    const workDir = join(tmpdir(), `conversion-${name}`);
    await mkdir(workDir, { recursive: true });
    try {
        return await fn(workDir);
    } finally {
        await rm(workDir, { recursive: true, force: true });
    }
}

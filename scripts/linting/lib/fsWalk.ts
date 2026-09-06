import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const IGNORED_DIRS = new Set([
    'node_modules',
    '.next',
    '.git',
    '.turbo',
    '.vercel',
    'dist',
    'build',
    'out',
    'coverage',
    'venv',
    '.venv',
    '__pycache__',
    'playwright-report',
    'test-results',
]);

export interface WalkOptions {
    extensions: string[];
    ignoredDirs?: Set<string>;
}

/** Recursively lists files under `root` matching one of `extensions`, skipping IGNORED_DIRS. */
export function walkFiles(root: string, options: WalkOptions): string[] {
    const ignored = options.ignoredDirs ?? IGNORED_DIRS;
    const results: string[] = [];

    const visit = (dir: string) => {
        let entries;
        try {
            entries = readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.') continue;
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
                if (ignored.has(entry.name)) continue;
                visit(full);
            } else if (
                options.extensions.some((ext) => entry.name.endsWith(ext))
            ) {
                results.push(full);
            }
        }
    };

    visit(root);
    return results;
}

export function countLines(filePath: string): number {
    try {
        const content = readFileSync(filePath, 'utf8');
        return content.length === 0 ? 0 : content.split('\n').length;
    } catch {
        return 0;
    }
}

export function fileSizeBytes(filePath: string): number {
    try {
        return statSync(filePath).size;
    } catch {
        return 0;
    }
}

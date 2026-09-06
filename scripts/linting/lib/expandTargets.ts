import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { IGNORED_DIRS } from './fsWalk';

const LINTABLE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

/** Lists the immediate child directories (and loose lintable files) of `target`. */
export function listImmediateChildren(root: string, target: string): string[] {
    const abs = join(root, target);
    let stat;
    try {
        stat = statSync(abs);
    } catch {
        return [];
    }
    if (!stat.isDirectory()) return [];

    let entries;
    try {
        entries = readdirSync(abs, { withFileTypes: true });
    } catch {
        return [];
    }

    const dirs = entries
        .filter(
            (e) =>
                e.isDirectory() &&
                !IGNORED_DIRS.has(e.name) &&
                !e.name.startsWith('.'),
        )
        .map((e) => join(target, e.name));
    const looseFiles = entries
        .filter((e) => e.isFile() && LINTABLE_EXT.test(e.name))
        .map((e) => join(target, e.name));

    return [...dirs, ...looseFiles];
}

import { existsSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { IGNORED_DIRS, walkFiles } from './fsWalk';
import { ROOT } from './paths';

const WEB_ALIASES = ['app', 'features', 'icons', 'lib', 'types'];
const ALLOWED_ROOTS = [
    'apps/web',
    'services/sync-worker',
    'services/conversion',
    'scripts',
    'tests',
];

function repoRelative(path: string): string {
    return relative(ROOT, path).split(sep).join('/');
}

function isAllowed(path: string): boolean {
    return (
        ALLOWED_ROOTS.some(
            (root) => path === root || path.startsWith(`${root}/`),
        ) ||
        ['eslint.config.mjs', 'tsconfig.json', 'tsconfig.base.json'].includes(
            path,
        )
    );
}

function resolveCandidate(input: string): string {
    const direct = isAbsolute(input) ? resolve(input) : resolve(ROOT, input);
    if (existsSync(direct)) return direct;
    if (
        WEB_ALIASES.some(
            (alias) => input === alias || input.startsWith(`${alias}/`),
        )
    ) {
        return resolve(ROOT, 'apps/web', input);
    }
    return direct;
}

export function resolveScopes(inputs: string[]): string[] {
    if (inputs.length === 0) return [];
    const scopes = inputs.map((input) => {
        const absolute = resolveCandidate(input);
        const scoped = repoRelative(absolute);
        if (!existsSync(absolute))
            throw new Error(`check target does not exist: ${input}`);
        if (scoped.startsWith('..') || !isAllowed(scoped)) {
            throw new Error(
                `check target is outside supported source roots: ${input}`,
            );
        }
        return scoped;
    });
    return [...new Set(scopes)].sort();
}

export function collectFiles(scopes: string[], extensions: string[]): string[] {
    const selected = scopes.length === 0 ? ALLOWED_ROOTS : scopes;
    const files = selected.flatMap((scope) => {
        const absolute = resolve(ROOT, scope);
        if (!existsSync(absolute)) return [];
        if (statSync(absolute).isFile()) {
            return extensions.some((ext) => absolute.endsWith(ext))
                ? [absolute]
                : [];
        }
        return walkFiles(absolute, { extensions, ignoredDirs: IGNORED_DIRS });
    });
    return [...new Set(files)].sort();
}

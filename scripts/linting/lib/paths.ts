import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
);

/** Every tsconfig.json in the monorepo that should be typechecked independently. */
export const ROOT_TS_PROJECT = join(ROOT, 'tsconfig.json');
export const WEB_TS_PROJECT = join(ROOT, 'apps/web/tsconfig.json');
export const SYNC_TS_PROJECT = join(ROOT, 'services/sync-worker/tsconfig.json');
export const CONVERSION_TS_PROJECT = join(
    ROOT,
    'services/conversion/tsconfig.json',
);

export const TS_PROJECTS = [
    ROOT_TS_PROJECT,
    WEB_TS_PROJECT,
    SYNC_TS_PROJECT,
    CONVERSION_TS_PROJECT,
];

/** Directories eslint should target explicitly rather than a bare `.`, so a
 * stray huge or generated directory can't silently balloon (or hang) the run. */
export const LINT_TARGETS = [
    'apps/web',
    'services/sync-worker',
    'services/conversion',
    'scripts',
    'tests',
    'eslint.config.mjs',
];

/** Where source code worth scanning for smells/stats actually lives. */
export const SOURCE_ROOTS = [
    join(ROOT, 'apps/web'),
    join(ROOT, 'services/sync-worker'),
    join(ROOT, 'services/conversion'),
    join(ROOT, 'scripts'),
];

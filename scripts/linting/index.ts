import { runLintPhase } from './lintPhase';
import { runTsPhase } from './tsPhase';
import { runSmellsPhase } from './smellsPhase';
import { runStatsPhase } from './statsPhase';
import { resolveScopes } from './lib/scope';
import { color, formatDuration } from './lib/terminal';

const PHASE_FLAGS = [
    '--lint-only',
    '--ts-only',
    '--smells-only',
    '--stats-only',
] as const;
type PhaseFlag = (typeof PHASE_FLAGS)[number];

interface CliOptions {
    batchSize?: number;
    cache: boolean;
    only?: PhaseFlag;
    scopes: string[];
}

function parseBatchSize(value: string): number {
    const size = Number(value);
    if (!Number.isInteger(size) || size < 25 || size > 500) {
        throw new Error('--batch-size must be an integer between 25 and 500');
    }
    return size;
}

function parseOptions(argv: string[]): CliOptions {
    const phaseFlags = PHASE_FLAGS.filter((flag) => argv.includes(flag));
    if (phaseFlags.length > 1)
        throw new Error('choose at most one --*-only flag');
    const batchArg = argv.find((arg) => arg.startsWith('--batch-size='));
    const knownFlags = new Set<string>([...PHASE_FLAGS, '--no-cache']);
    const unknownFlags = argv.filter(
        (arg) =>
            arg.startsWith('--') &&
            !knownFlags.has(arg) &&
            !arg.startsWith('--batch-size='),
    );
    if (unknownFlags.length > 0)
        throw new Error(`unknown option: ${unknownFlags.join(', ')}`);
    const targets = argv.filter((arg) => !arg.startsWith('--'));
    return {
        cache: !argv.includes('--no-cache'),
        scopes: resolveScopes(targets),
        ...(phaseFlags[0] && { only: phaseFlags[0] }),
        ...(batchArg && {
            batchSize: parseBatchSize(batchArg.slice('--batch-size='.length)),
        }),
    };
}

function printSummary(
    durations: Array<{ name: string; durationMs: number }>,
    gatingErrors: number,
    totalMs: number,
): void {
    console.log(`\n${color.cyan('Summary')}`);
    for (const item of durations) {
        console.log(
            `  ${item.name.padEnd(18)} ${color.dim(formatDuration(item.durationMs))}`,
        );
    }
    console.log(
        `  ${'Total'.padEnd(18)} ${color.dim(formatDuration(totalMs))}`,
    );
    if (gatingErrors > 0) {
        console.error(
            `\n${color.red('✗')} ${color.red(`${gatingErrors} error(s) found`)} · reports/`,
        );
        process.exitCode = 1;
    } else {
        console.log(
            `\n${color.green('✓')} ${color.green('All gating checks passed')}`,
        );
    }
}

function main(): void {
    const startedAt = performance.now();
    const options = parseOptions(process.argv.slice(2));
    const scopeLabel =
        options.scopes.length === 0
            ? 'entire repository'
            : options.scopes.join(', ');
    console.log(
        `${color.cyan('WebWidgets checks')} ${color.dim(`· ${scopeLabel}`)}`,
    );
    const durations: Array<{ name: string; durationMs: number }> = [];
    let gatingErrors = 0;
    if (!options.only || options.only === '--lint-only') {
        const result = runLintPhase(options);
        gatingErrors += result.errors;
        durations.push({ name: 'ESLint', durationMs: result.durationMs });
    }
    if (!options.only || options.only === '--ts-only') {
        const result = runTsPhase(options.scopes, options.cache);
        gatingErrors += result.errors;
        durations.push({ name: 'TypeScript', durationMs: result.durationMs });
    }
    if (!options.only || options.only === '--smells-only') {
        const result = runSmellsPhase(options.scopes);
        durations.push({ name: 'Code smells', durationMs: result.durationMs });
    }
    if (!options.only || options.only === '--stats-only') {
        const result = runStatsPhase(options.scopes);
        durations.push({
            name: 'Repository stats',
            durationMs: result.durationMs,
        });
    }
    printSummary(durations, gatingErrors, performance.now() - startedAt);
}

try {
    main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n${color.red('✗ Check runner failed:')} ${message}`);
    process.exitCode = 1;
}

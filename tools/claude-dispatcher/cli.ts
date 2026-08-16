#!/usr/bin/env node
import { dispatchOnce } from './dispatch';
import { listOpenIssues } from './github';
import { loadConfig } from './config';
import { runPreflight } from './preflight';
import { ineligibleReason, selectEligibleIssues } from './selection';
import { loadLatestRun } from './state';

async function main(): Promise<void> {
    const config = loadConfig();
    const [command = 'help'] = process.argv.slice(2);
    const dryRun = process.argv.includes('--dry-run');
    if (command === 'preflight') {
        const checks = await runPreflight(config);
        for (const check of checks) {
            process.stdout.write(
                `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}\n`,
            );
        }
        if (checks.some((check) => !check.ok)) process.exitCode = 1;
        return;
    }
    if (command === 'queue') {
        const issues = await listOpenIssues(config);
        const eligible = new Set(
            selectEligibleIssues(issues, config).map((issue) => issue.number),
        );
        for (const issue of issues) {
            const reason = eligible.has(issue.number)
                ? 'eligible'
                : ineligibleReason(issue, config);
            process.stdout.write(
                `#${issue.number}\t${reason ?? 'ineligible'}\t${issue.title}\n`,
            );
        }
        if (!dryRun)
            process.stdout.write(
                'Queue inspection is read-only; use dispatch to run one issue.\n',
            );
        return;
    }
    if (command === 'dispatch') {
        await dispatchOnce(config, dryRun);
        return;
    }
    if (command === 'status') {
        const run = loadLatestRun(config);
        process.stdout.write(
            run ? `${JSON.stringify(run, null, 2)}\n` : 'No runs recorded.\n',
        );
        return;
    }
    process.stdout.write(
        'Usage: npm run dispatcher -- <preflight|queue|dispatch|status> [--dry-run]\n',
    );
}

main().catch((error: unknown) => {
    process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
});

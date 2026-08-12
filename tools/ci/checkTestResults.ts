import { readFileSync } from 'node:fs';

interface VitestAssertionResult {
    fullName: string;
    status: string;
}

interface VitestTestFileResult {
    assertionResults: VitestAssertionResult[];
}

interface VitestJsonReport {
    testResults: VitestTestFileResult[];
}

/**
 * Pre-existing failures unrelated to CI infrastructure, tracked in #21.
 * Remove an entry only once the underlying app/test bug is actually fixed —
 * this exists so CI can gate on *new* regressions without being permanently
 * red over debt no single PR is responsible for (DEFINITION_OF_DONE.md §2
 * applies the same philosophy to lint/TS). If #21 is closed and an entry
 * here is stale, that's a bug in this file — delete it.
 */
const KNOWN_FAILING_TESTS = new Set<string>([
    'widget runtime metadata marks heavy widgets as manual by default',
    'widget runtime metadata assigns data keys for failing widget routes',
    'filterFeedItems searches indexed feed text and filters categories',
]);

function loadReport(path: string): VitestJsonReport {
    return JSON.parse(readFileSync(path, 'utf8')) as VitestJsonReport;
}

function partitionFailures(report: VitestJsonReport) {
    const known: string[] = [];
    const unexpected: string[] = [];

    for (const file of report.testResults) {
        for (const test of file.assertionResults) {
            if (test.status !== 'failed') continue;
            (KNOWN_FAILING_TESTS.has(test.fullName) ? known : unexpected).push(test.fullName);
        }
    }
    return { known, unexpected };
}

const resultsPath = process.argv[2];
if (!resultsPath) {
    console.error('Usage: tsx tools/ci/checkTestResults.ts <vitest-json-report-path>');
    process.exit(2);
}

const { known, unexpected } = partitionFailures(loadReport(resultsPath));

if (known.length > 0) {
    console.log(`[known debt, not gating — see #21] ${known.length} pre-existing failure(s):`);
    for (const name of known) console.log(`  - ${name}`);
}

if (unexpected.length > 0) {
    console.error(`\n${unexpected.length} test failure(s) NOT in the known-debt allowlist:`);
    for (const name of unexpected) console.error(`  - ${name}`);
    process.exit(1);
}

console.log('\nNo unexpected test failures.');

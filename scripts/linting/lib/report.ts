import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './paths';

export interface ReportMeta {
    phase: string;
    status: 'pass' | 'fail';
    generatedAt: string;
    durationMs?: number;
    [key: string]: unknown;
}

/**
 * Writes `<phase>.json`/`latest.json` and `<phase>.md`/`latest.md` under
 * reports/<phase>/, mirroring the dated + latest convention. Every phase
 * shares this so `reports/<phase>/latest.md` is always a stable link for
 * humans and `latest.json` for tooling.
 */
export function writeReport(
    phase: string,
    report: ReportMeta,
    markdownLines: string[],
): void {
    const dir = join(ROOT, 'reports', phase);
    mkdirSync(dir, { recursive: true });
    const date = report.generatedAt.slice(0, 10);
    const json = `${JSON.stringify(report, null, 2)}\n`;
    const markdown = `${markdownLines.join('\n')}\n`;

    writeFileSync(join(dir, `${date}.json`), json);
    writeFileSync(join(dir, 'latest.json'), json);
    writeFileSync(join(dir, `${date}.md`), markdown);
    writeFileSync(join(dir, 'latest.md'), markdown);
}

export function markdownTable(
    headers: string[],
    rows: Array<Array<string | number>>,
): string[] {
    if (rows.length === 0) return ['_None found._'];
    return [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.join(' | ')} |`),
    ];
}

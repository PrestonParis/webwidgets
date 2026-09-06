import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { walkFiles } from './lib/fsWalk';
import { ROOT } from './lib/paths';
import { markdownTable, writeReport } from './lib/report';

const LONG_FILE_LINES = 500;
const LONG_FUNCTION_LINES = 60;
const TOO_MANY_PARAMS = 5;

interface Smell {
    rule: string;
    file: string;
    line: number;
    detail: string;
}

function indentWidth(line: string): number {
    const match = line.match(/^[ \t]*/);
    return match ? match[0].replace(/\t/g, '    ').length : 0;
}

function scanFile(filePath: string): Smell[] {
    const smells: Smell[] = [];
    const relPath = relative(ROOT, filePath);
    const lines = readFileSync(filePath, 'utf8').split('\n');

    if (lines.length > LONG_FILE_LINES) {
        smells.push({
            rule: 'long-file',
            file: relPath,
            line: 1,
            detail: `${lines.length} lines`,
        });
    }

    let openDef: { name: string; startLine: number; indent: number } | null =
        null;
    const closeDef = (endLine: number) => {
        if (!openDef) return;
        const length = endLine - openDef.startLine;
        if (length > LONG_FUNCTION_LINES) {
            smells.push({
                rule: 'long-function',
                file: relPath,
                line: openDef.startLine + 1,
                detail: `${openDef.name} — ${length} lines`,
            });
        }
        openDef = null;
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        const indent = indentWidth(line);

        if (openDef && trimmed.length > 0 && indent <= openDef.indent) {
            closeDef(index);
        }

        const defMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)/);
        if (defMatch) {
            if (openDef) closeDef(index);
            const name = defMatch[1] ?? '<anonymous>';
            const params = (defMatch[2] ?? '')
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p.length > 0 && p !== 'self' && p !== 'cls');
            if (params.length > TOO_MANY_PARAMS) {
                smells.push({
                    rule: 'too-many-params',
                    file: relPath,
                    line: index + 1,
                    detail: `${name} — ${params.length} params`,
                });
            }
            openDef = { name, startLine: index, indent };
        }

        if (/^except\s*:/.test(trimmed)) {
            smells.push({
                rule: 'bare-except',
                file: relPath,
                line: index + 1,
                detail: 'bare `except:` clause',
            });
        }
        if (/^from\s+\S+\s+import\s+\*/.test(trimmed)) {
            smells.push({
                rule: 'wildcard-import',
                file: relPath,
                line: index + 1,
                detail: trimmed.slice(0, 80),
            });
        }
        if (/^print\(/.test(trimmed)) {
            smells.push({
                rule: 'print-statement',
                file: relPath,
                line: index + 1,
                detail: trimmed.slice(0, 80),
            });
        }
        if (/\b(TODO|FIXME)\b/.test(trimmed)) {
            smells.push({
                rule: 'todo-fixme',
                file: relPath,
                line: index + 1,
                detail: trimmed.slice(0, 80),
            });
        }
    });

    if (openDef) closeDef(lines.length);
    return smells;
}

function main() {
    const targetArg = process.argv[2];
    if (!targetArg) {
        console.error(
            'Usage: tsx scripts/linting/python-smells.ts <directory>',
        );
        process.exit(1);
    }
    const targetDir = join(ROOT, targetArg);
    const files = walkFiles(targetDir, { extensions: ['.py'] });
    const smells = files.flatMap(scanFile);

    const ruleCounts = new Map<string, number>();
    for (const smell of smells) {
        ruleCounts.set(smell.rule, (ruleCounts.get(smell.rule) ?? 0) + 1);
    }
    const generatedAt = new Date().toISOString();

    writeReport(
        'py-smells',
        {
            phase: 'py-smells',
            status: 'pass',
            generatedAt,
            target: targetArg,
            filesScanned: files.length,
            totalSmells: smells.length,
            byRule: Object.fromEntries(ruleCounts),
            results: smells,
        },
        [
            `# Python smells report — ${generatedAt.slice(0, 10)}`,
            '',
            `- Generated: ${generatedAt}`,
            `- Target: ${targetArg}`,
            `- Files scanned: ${files.length}`,
            `- Total findings: ${smells.length}`,
            '',
            '## By rule',
            '',
            ...markdownTable(
                ['Rule', 'Count'],
                [...ruleCounts.entries()].sort((a, b) => b[1] - a[1]),
            ),
            '',
            '## Findings (top 200)',
            '',
            ...(smells.length === 0
                ? ['_None found._']
                : smells
                      .slice(0, 200)
                      .map(
                          (s) =>
                              `- \`${s.file}:${s.line}\` **${s.rule}** ${s.detail}`,
                      )),
        ],
    );

    console.log(
        `[py-smells] ${smells.length} findings across ${files.length} files`,
    );
    // Advisory only — never blocks `py:check`.
}

main();

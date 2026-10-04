import { relative } from 'node:path';
import { Node, Project, SyntaxKind, type SourceFile } from 'ts-morph';
import { ROOT } from './lib/paths';
import { markdownTable, writeReport } from './lib/report';
import { collectFiles } from './lib/scope';
import { phaseResult, phaseStart } from './lib/terminal';

const LONG_FILE_LINES = 500;
const LONG_FUNCTION_LINES = 80;
const TOO_MANY_PARAMS = 5;
const MAX_NESTING_DEPTH = 4;
const TOO_MANY_ANY = 5;

const NESTING_KINDS = new Set<SyntaxKind>([
    SyntaxKind.IfStatement,
    SyntaxKind.ForStatement,
    SyntaxKind.ForInStatement,
    SyntaxKind.ForOfStatement,
    SyntaxKind.WhileStatement,
    SyntaxKind.DoStatement,
    SyntaxKind.SwitchStatement,
    SyntaxKind.TryStatement,
]);

interface Smell {
    rule: string;
    file: string;
    line: number;
    detail: string;
}

export interface SmellsPhaseResult {
    count: number;
    durationMs: number;
}

function getFunctionName(node: Node): string {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
        return node.getName() ?? '<anonymous>';
    }
    const parent = node.getParent();
    if (Node.isVariableDeclaration(parent)) return parent.getName();
    if (Node.isPropertyAssignment(parent)) return parent.getName();
    return '<anonymous>';
}

function maxNestingDepth(sourceFile: SourceFile): number {
    let max = 0;
    const visit = (node: Node, depth: number) => {
        const nextDepth = NESTING_KINDS.has(node.getKind()) ? depth + 1 : depth;
        if (nextDepth > max) max = nextDepth;
        node.forEachChild((child) => visit(child, nextDepth));
    };
    sourceFile.forEachChild((child) => visit(child, 0));
    return max;
}

export function runSmellsPhase(scopes: string[]): SmellsPhaseResult {
    const startedAt = performance.now();
    phaseStart('Code smells', 'advisory');
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const defaultScopes = [
        'apps/web',
        'services/sync-worker',
        'services/conversion',
        'scripts',
    ];
    const files = collectFiles(scopes.length === 0 ? defaultScopes : scopes, [
        '.ts',
        '.tsx',
    ]).filter((file) => !file.endsWith('.d.ts'));
    project.addSourceFilesAtPaths(files);

    const smells: Smell[] = [];
    const anyCounts = new Map<string, number>();
    let consoleLogCount = 0;
    let todoCount = 0;

    for (const sourceFile of project.getSourceFiles()) {
        const filePath = relative(ROOT, sourceFile.getFilePath());
        const lineCount = sourceFile.getEndLineNumber();
        if (lineCount > LONG_FILE_LINES) {
            smells.push({
                rule: 'long-file',
                file: filePath,
                line: 1,
                detail: `${lineCount} lines`,
            });
        }

        sourceFile.forEachDescendant((node) => {
            if (Node.isFunctionLikeDeclaration(node)) {
                const start = node.getStartLineNumber();
                const length = node.getEndLineNumber() - start;
                const name = getFunctionName(node);
                if (length > LONG_FUNCTION_LINES) {
                    smells.push({
                        rule: 'long-function',
                        file: filePath,
                        line: start,
                        detail: `${name} — ${length} lines`,
                    });
                }
                const paramCount = node.getParameters().length;
                if (paramCount > TOO_MANY_PARAMS) {
                    smells.push({
                        rule: 'too-many-params',
                        file: filePath,
                        line: start,
                        detail: `${name} — ${paramCount} params`,
                    });
                }
            }
            if (node.getKind() === SyntaxKind.AnyKeyword) {
                anyCounts.set(filePath, (anyCounts.get(filePath) ?? 0) + 1);
            }
            if (
                Node.isCallExpression(node) &&
                node.getExpression().getText() === 'console.log'
            ) {
                consoleLogCount += 1;
            }
        });

        const depth = maxNestingDepth(sourceFile);
        if (depth > MAX_NESTING_DEPTH) {
            smells.push({
                rule: 'deep-nesting',
                file: filePath,
                line: 1,
                detail: `max block depth ${depth}`,
            });
        }

        const todoMatches = sourceFile.getFullText().match(/\b(TODO|FIXME)\b/g);
        if (todoMatches) todoCount += todoMatches.length;
    }

    for (const [file, count] of anyCounts) {
        if (count > TOO_MANY_ANY) {
            smells.push({
                rule: 'any-usage',
                file,
                line: 1,
                detail: `${count} uses of \`any\``,
            });
        }
    }

    const ruleCounts = new Map<string, number>();
    for (const smell of smells) {
        ruleCounts.set(smell.rule, (ruleCounts.get(smell.rule) ?? 0) + 1);
    }
    const generatedAt = new Date().toISOString();
    const durationMs = performance.now() - startedAt;

    writeReport(
        'smells',
        {
            phase: 'smells',
            // Smells are advisory, never a hard gate.
            status: 'pass',
            generatedAt,
            durationMs,
            scopes,
            filesScanned: project.getSourceFiles().length,
            totalSmells: smells.length,
            consoleLogCount,
            todoCount,
            byRule: Object.fromEntries(ruleCounts),
            results: smells,
        },
        [
            `# Code smells report — ${generatedAt.slice(0, 10)}`,
            '',
            `- Generated: ${generatedAt}`,
            `- Duration: ${Math.round(durationMs)}ms`,
            `- Files scanned: ${project.getSourceFiles().length}`,
            `- Total findings: ${smells.length}`,
            `- \`console.log\` calls: ${consoleLogCount}`,
            `- TODO/FIXME comments: ${todoCount}`,
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

    phaseResult(
        'Code smells',
        smells.length > 0 ? 'warn' : 'pass',
        `${smells.length} findings · ${project.getSourceFiles().length} files`,
        durationMs,
    );
    return { count: smells.length, durationMs };
}

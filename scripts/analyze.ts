import { Project, SyntaxKind, DiagnosticCategory } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: false,
});

type Severity = 'error' | 'warn' | 'info';

type Issue = {
    file: string;
    line?: number;
    type:
        | 'TS_ERROR'
        | 'FAT_FILE'
        | 'INLINE_SVG'
        | 'DUPLICATE_API'
        | 'UNUSED_EXPORT'
        | 'HOOK_HEAVY'
        | 'TODO_FIXME'
        | 'LARGE_COMPONENT';
    severity: Severity;
    message: string;
};

const issues: Issue[] = [];

// -------------------------
// PATH HELPERS
// -------------------------
const THIS_FILE = __filename;
const isIgnoredFile = (filePath: string) =>
    filePath === THIS_FILE ||
    filePath.includes('/node_modules/') ||
    filePath.includes('/.next/') ||
    filePath.includes('/dist/') ||
    filePath.endsWith('.d.ts');

const isIconFolder = (filePath: string) =>
    filePath.includes('/components/Icons/') ||
    filePath.includes('/components/icons/');

const shortPath = (filePath: string) => {
    const cwd = process.cwd();
    return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
};

// -------------------------
// TS ERRORS
// -------------------------
const detectTsErrors = () => {
    const diagnostics = project.getPreEmitDiagnostics();
    diagnostics.forEach((d) => {
        const filePath = d.getSourceFile()?.getFilePath() ?? 'unknown';
        if (isIgnoredFile(filePath)) return;

        const category = d.getCategory();
        // Skip suggestions (category 3) — too noisy
        if (category === DiagnosticCategory.Suggestion) return;

        const line = d.getSourceFile()
            ? d.getSourceFile()!.getLineAndColumnAtPos(d.getStart() ?? 0).line
            : undefined;

        issues.push({
            file: filePath,
            line,
            type: 'TS_ERROR',
            severity: category === DiagnosticCategory.Error ? 'error' : 'warn',
            message: `TS${d.getCode()}: ${d.getMessageText().toString()}`,
        });
    });
};

// -------------------------
// PER-FILE ANALYSIS
// -------------------------
project.getSourceFiles().forEach((file) => {
    const filePath = file.getFilePath();
    if (isIgnoredFile(filePath)) return;

    const text = file.getFullText();
    const lines = text.split('\n');
    const lineCount = lines.length;

    // Count only top-level hook calls (use* at call-expression level)
    const hooks = file
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter((c) => {
            const expr = c.getExpression().getText();
            // Must start with lowercase 'use' followed by uppercase — real hook naming convention
            return /^use[A-Z]/.test(expr);
        });

    const exportCount = file.getExportedDeclarations().size;

    // -------------------------
    // FAT FILE
    // -------------------------
    const fatReasons: string[] = [];
    if (lineCount > 300) fatReasons.push(`${lineCount} lines (limit: 300)`);
    if (exportCount > 12) fatReasons.push(`${exportCount} exports (limit: 12)`);

    if (fatReasons.length > 0) {
        issues.push({
            file: filePath,
            type: 'FAT_FILE',
            severity: 'warn',
            message: `File is too large: ${fatReasons.join(', ')}`,
        });
    }

    // -------------------------
    // HOOK-HEAVY COMPONENTS
    // Only flag .tsx files (components), not hooks files themselves
    // -------------------------
    if (
        hooks.length > 6 &&
        filePath.endsWith('.tsx') &&
        !filePath.includes('/hooks/')
    ) {
        issues.push({
            file: filePath,
            type: 'HOOK_HEAVY',
            severity: 'warn',
            message: `${hooks.length} hook calls in a component — extract logic into a custom hook`,
        });
    }

    // -------------------------
    // LARGE COMPONENT FUNCTION
    // Flag individual functions/components that are oversized
    // -------------------------
    const functions = [
        ...file.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
        ...file.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ];

    functions.forEach((fn) => {
        const start = fn.getStartLineNumber();
        const end = fn.getEndLineNumber();
        const fnLines = end - start;
        const name =
            'getName' in fn && typeof fn.getName === 'function'
                ? (fn.getName() ?? '<anonymous>')
                : (fn.getParent()?.getSymbol()?.getName() ?? '<anonymous>');

        if (fnLines > 100) {
            issues.push({
                file: filePath,
                line: start,
                type: 'LARGE_COMPONENT',
                severity: 'warn',
                message: `Function "${name}" is ${fnLines} lines long (limit: 100) — consider splitting`,
            });
        }
    });

    // -------------------------
    // INLINE SVG
    // -------------------------
    if (text.includes('<svg') && !isIconFolder(filePath)) {
        const svgLine = lines.findIndex((l) => l.includes('<svg')) + 1;
        issues.push({
            file: filePath,
            line: svgLine,
            type: 'INLINE_SVG',
            severity: 'info',
            message:
                'Inline <svg> found outside /components/Icons — move to an icon component',
        });
    }

    // -------------------------
    // TODO / FIXME comments
    // -------------------------
    lines.forEach((line, i) => {
        if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line)) {
            const match = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX[^\n]*)/i);
            issues.push({
                file: filePath,
                line: i + 1,
                type: 'TODO_FIXME',
                severity: 'info',
                message: match?.[0].trim() ?? 'TODO/FIXME comment',
            });
        }
    });

    // -------------------------
    // DIRECT API ROUTE CALLS
    // Flag hardcoded fetch('/api/...') calls in components — should go through a service layer
    // -------------------------
    const fetchMatches = text.matchAll(/fetch\(['"`](\/api\/[^'"`]+)['"`]/g);
    for (const match of fetchMatches) {
        const apiPath = match[1];
        const callLine = text.slice(0, match.index).split('\n').length;
        issues.push({
            file: filePath,
            line: callLine,
            type: 'DUPLICATE_API',
            severity: 'warn',
            message: `Direct fetch to "${apiPath}" — consider centralising in an API service module`,
        });
    }
});

// -------------------------
// RUN TS ERROR CHECK
// -------------------------
detectTsErrors();

// -------------------------
// OUTPUT
// -------------------------
const SEVERITY_ICON: Record<Severity, string> = {
    error: '🔴',
    warn: '🟡',
    info: '🔵',
};

console.log('\n🔍 CODEBASE ANALYSIS REPORT\n');
console.log(
    `Scanned ${project.getSourceFiles().filter((f) => !isIgnoredFile(f.getFilePath())).length} files\n`,
);

if (issues.length === 0) {
    console.log('✅ No issues detected');
    process.exit(0);
}

// Group by type
const grouped = issues.reduce<Record<string, Issue[]>>((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
}, {});

const TYPE_LABEL: Record<string, string> = {
    TS_ERROR: 'TypeScript Errors',
    FAT_FILE: 'Oversized Files',
    LARGE_COMPONENT: 'Oversized Functions / Components',
    HOOK_HEAVY: 'Hook-Heavy Components',
    INLINE_SVG: 'Inline SVGs',
    DUPLICATE_API: 'Direct API Calls (no service layer)',
    UNUSED_EXPORT: 'Possibly Unused Exports',
    TODO_FIXME: 'TODO / FIXME Comments',
};

// Print errors first, then warnings, then info
const SEVERITY_ORDER: Severity[] = ['error', 'warn', 'info'];

const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) => {
    const sA = SEVERITY_ORDER.indexOf(a[0].severity);
    const sB = SEVERITY_ORDER.indexOf(b[0].severity);
    return sA - sB;
});

let errorCount = 0;
let warnCount = 0;

for (const [type, items] of sortedEntries) {
    const label = TYPE_LABEL[type] ?? type;
    console.log(`\n── ${label} (${items.length}) ──`);

    items.forEach((issue) => {
        const icon = SEVERITY_ICON[issue.severity];
        const loc = issue.line ? `:${issue.line}` : '';
        console.log(`${icon}  ${shortPath(issue.file)}${loc}`);
        console.log(`   ${issue.message}`);

        if (issue.severity === 'error') errorCount++;
        else if (issue.severity === 'warn') warnCount++;
    });
}

console.log('\n─────────────────────────────────');
console.log(
    `Total: ${issues.length} issues  (🔴 ${errorCount} errors, 🟡 ${warnCount} warnings, 🔵 ${issues.length - errorCount - warnCount} info)`,
);

if (errorCount > 0) process.exit(1);

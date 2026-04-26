import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
});

type Issue = {
    file: string;
    type:
        | 'TS_ERROR'
        | 'FAT_FILE'
        | 'INLINE_SVG'
        | 'DUPLICATE_API'
        | 'UNUSED_EXPORT'
        | 'HOOK_HEAVY';
    message: string;
};

const issues: Issue[] = [];

const isIconFolder = (filePath: string) =>
    filePath.includes('/components/Icons/');

const detectTsErrors = () => {
    const diagnostics = project.getPreEmitDiagnostics();

    diagnostics.forEach((d) => {
        const file = d.getSourceFile()?.getFilePath() ?? 'unknown';

        issues.push({
            file,
            type: 'TS_ERROR',
            message: d.getMessageText().toString(),
        });
    });
};

project.getSourceFiles().forEach((file) => {
    const filePath = file.getFilePath();
    const text = file.getFullText();

    const lines = text.split('\n').length;
    const exports = file.getExportedDeclarations().size;

    const hooks = file
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter((c) => {
            const expr = c.getExpression().getText();
            return expr.startsWith('use');
        });

    // -------------------------
    // FAT FILE DETECTION
    // -------------------------
    if (lines > 250 || exports > 10 || hooks.length > 8) {
        issues.push({
            file: filePath,
            type: 'FAT_FILE',
            message: `lines=${lines}, exports=${exports}, hooks=${hooks.length}`,
        });
    }

    // -------------------------
    // INLINE SVG DETECTION
    // -------------------------
    if (text.includes('<svg') && !isIconFolder(filePath)) {
        issues.push({
            file: filePath,
            type: 'INLINE_SVG',
            message: 'Inline SVG found outside /components/Icons',
        });
    }

    // -------------------------
    // API DUPLICATION DETECTION
    // -------------------------
    if (text.includes('/api/gmail/inbox')) {
        issues.push({
            file: filePath,
            type: 'DUPLICATE_API',
            message: 'Uses /api/gmail/inbox directly',
        });
    }

    // -------------------------
    // UNUSUALLY LOW EXPORT USAGE (weak heuristic)
    // -------------------------
    file.getExportedDeclarations().forEach((_, name) => {
        const refs = file
            .getDescendantsOfKind(SyntaxKind.Identifier)
            .filter((id) => id.getText() === name);

        if (refs.length <= 1) {
            issues.push({
                file: filePath,
                type: 'UNUSED_EXPORT',
                message: `Possibly unused export: ${name}`,
            });
        }
    });

    // -------------------------
    // HOOK HEAVY COMPONENTS
    // -------------------------
    if (hooks.length > 6) {
        issues.push({
            file: filePath,
            type: 'HOOK_HEAVY',
            message: `Too many hooks (${hooks.length}) - consider splitting logic`,
        });
    }
});

// -------------------------
// TS ERRORS (GLOBAL)
// -------------------------
detectTsErrors();

// -------------------------
// OUTPUT
// -------------------------
console.log('\n🔍 CODEBASE ANALYSIS REPORT\n');

const grouped = issues.reduce<Record<string, Issue[]>>((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
}, {});

Object.entries(grouped).forEach(([type, items]) => {
    console.log(`\n🚨 ${type} (${items.length})`);
    items.forEach((i) => {
        console.log(`- ${i.file}`);
        console.log(`  → ${i.message}`);
    });
});

if (issues.length === 0) {
    console.log('✅ No major issues detected');
}

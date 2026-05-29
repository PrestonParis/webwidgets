import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import type {
    ResearchArtifactSummary,
    ResearchPipelineRequest,
    ResearchPipelineResult,
    ResearchSourceKind,
    ResearchStatus,
} from '@/features/research/types/research';

async function exists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function getResearchRoot(rootPath?: string): string | null {
    const configuredRoot =
        rootPath?.trim() || process.env.RESEARCH_ROOT?.trim();
    if (!configuredRoot) return null;
    if (!path.isAbsolute(configuredRoot)) return null;
    return path.resolve(configuredRoot);
}

function getResearchPaths(rootPath?: string) {
    const root = getResearchRoot(rootPath);
    return {
        root,
        configPath: root ? path.join(root, 'config.yaml') : undefined,
        artifactDir: root ? path.join(root, 'data', 'artifacts') : undefined,
    };
}

function normalizeSourceKind(
    sourceKind?: ResearchSourceKind,
): ResearchSourceKind {
    return sourceKind ?? 'observatory-local';
}

function parseVaults(config: string): Array<{ name: string; path: string }> {
    const vaults: Array<{ name: string; path: string }> = [];
    const blocks = config.split(/\n(?=\s*-\s+name:)/);
    for (const block of blocks) {
        const name = /name:\s*["']?([^"'\n]+)["']?/i.exec(block)?.[1];
        const vaultPath = /path:\s*["']?([^"'\n]+)["']?/i.exec(block)?.[1];
        if (name && vaultPath) vaults.push({ name, path: vaultPath });
    }
    return vaults;
}

export async function getResearchStatus(
    rootPath?: string,
    sourceKind?: ResearchSourceKind,
): Promise<ResearchStatus> {
    const kind = normalizeSourceKind(sourceKind);
    const paths = getResearchPaths(rootPath);
    if (!paths.root) {
        return {
            available: false,
            configured: false,
            vaults: [],
            artifactCount: 0,
            localRunEnabled: false,
            unavailableReason:
                'Add an absolute local research source path or configure RESEARCH_ROOT.',
        };
    }

    const rootExists = await exists(paths.root);
    if (kind === 'obsidian-vault') {
        if (!rootExists) {
            return {
                available: false,
                configured: true,
                sourceKind: kind,
                rootPath: paths.root,
                vaults: [],
                artifactCount: 0,
                localRunEnabled: false,
                unavailableReason:
                    'Obsidian vault path was not found at the configured location.',
            };
        }

        const artifactCount = await countMarkdownFiles(paths.root);
        return {
            available: true,
            configured: true,
            sourceKind: kind,
            rootPath: paths.root,
            vaults: [
                {
                    name: path.basename(paths.root),
                    path: paths.root,
                    exists: true,
                },
            ],
            artifactCount,
            localRunEnabled: false,
            unavailableReason:
                'Pipeline execution is unavailable for plain Obsidian vault sources.',
        };
    }

    if (!paths.configPath || !paths.artifactDir) {
        return {
            available: false,
            configured: true,
            sourceKind: kind,
            rootPath: paths.root,
            vaults: [],
            artifactCount: 0,
            localRunEnabled: false,
            unavailableReason:
                'Research source paths could not be derived from the configured root.',
        };
    }

    const configExists = await exists(paths.configPath);
    if (!rootExists || !configExists) {
        return {
            available: false,
            configured: true,
            sourceKind: kind,
            rootPath: paths.root,
            configPath: paths.configPath,
            vaults: [],
            artifactCount: 0,
            localRunEnabled: false,
            unavailableReason:
                'Research source or config.yaml was not found at the configured path.',
        };
    }

    const config = await fs.readFile(paths.configPath, 'utf8');
    const vaults = await Promise.all(
        parseVaults(config).map(async (vault) => ({
            name: vault.name,
            path: path.resolve(paths.root!, vault.path),
            exists: await exists(path.resolve(paths.root!, vault.path)),
        })),
    );
    const artifactCount = (await exists(paths.artifactDir))
        ? (await fs.readdir(paths.artifactDir)).filter((file) =>
              file.endsWith('.json'),
          ).length
        : 0;

    return {
        available: true,
        configured: true,
        sourceKind: 'observatory-local',
        rootPath: paths.root,
        configPath: paths.configPath,
        vaults,
        artifactCount,
        localRunEnabled: process.env.RESEARCH_LOCAL_RUN !== 'disabled',
    };
}

type RawArtifact = {
    id?: string;
    sourceType?: string;
    summary?: string;
    frontmatter?: {
        title?: string;
        source?: string;
        category?: string;
        tags?: string[];
        created?: string;
    };
};

function summarizeArtifact(raw: RawArtifact): ResearchArtifactSummary {
    return {
        id: raw.id ?? crypto.randomUUID(),
        title: raw.frontmatter?.title ?? 'Untitled artifact',
        source: raw.frontmatter?.source ?? '',
        sourceType: raw.sourceType ?? 'unknown',
        category: raw.frontmatter?.category ?? 'uncategorized',
        tags: raw.frontmatter?.tags ?? [],
        summary: raw.summary ?? '',
        created: raw.frontmatter?.created ?? '',
    };
}

export async function listResearchArtifacts(
    rootPath?: string,
    sourceKind?: ResearchSourceKind,
    query = '',
): Promise<ResearchArtifactSummary[]> {
    const kind = normalizeSourceKind(sourceKind);
    const paths = getResearchPaths(rootPath);
    if (kind === 'obsidian-vault') {
        if (!paths.root || !(await exists(paths.root))) return [];
        return listObsidianArtifacts(paths.root, query);
    }

    if (!paths.artifactDir || !(await exists(paths.artifactDir))) return [];
    const files = (await fs.readdir(paths.artifactDir))
        .filter((file) => file.endsWith('.json'))
        .sort()
        .reverse();
    const normalizedQuery = query.trim().toLowerCase();
    const artifacts: ResearchArtifactSummary[] = [];

    for (const file of files.slice(0, 500)) {
        try {
            const raw = JSON.parse(
                await fs.readFile(path.join(paths.artifactDir, file), 'utf8'),
            ) as RawArtifact;
            const artifact = summarizeArtifact(raw);
            const haystack = [
                artifact.title,
                artifact.source,
                artifact.category,
                artifact.tags.join(' '),
                artifact.summary,
            ]
                .join(' ')
                .toLowerCase();
            if (!normalizedQuery || haystack.includes(normalizedQuery)) {
                artifacts.push(artifact);
            }
        } catch {
            // Skip malformed artifact files; they are not useful runtime data.
        }
    }

    return artifacts.slice(0, 50);
}

function buildResearchCommand(input: ResearchPipelineRequest): string[] {
    if (input.mode === 'academic') {
        return [
            'run',
            '--project',
            'src/Observatory.CLI/Observatory.CLI.csproj',
            '--',
            'academic',
            input.topic,
            '--limit',
            String(input.webLimit),
            ...(input.tags.length ? ['--tags', ...input.tags] : []),
        ];
    }

    return [
        'run',
        '--project',
        'src/Observatory.CLI/Observatory.CLI.csproj',
        '--',
        'explore',
        input.topic,
        '--web-limit',
        String(input.webLimit),
        '--youtube-limit',
        String(input.youtubeLimit),
        '--wiki-links',
        String(input.wikiLinks),
        ...(input.tags.length ? ['--tags', ...input.tags] : []),
    ];
}

export async function runResearchPipeline(
    input: ResearchPipelineRequest,
): Promise<ResearchPipelineResult> {
    const paths = getResearchPaths(input.sourceRootPath);
    const sourceKind = normalizeSourceKind(input.sourceKind);
    const status = await getResearchStatus(input.sourceRootPath, sourceKind);
    const command = buildResearchCommand(input);

    if (sourceKind !== 'observatory-local') {
        return {
            ok: false,
            command: ['dotnet', ...command],
            output: 'Pipeline execution requires a configured Observatory source.',
            exitCode: 1,
        };
    }

    if (!status.available || !paths.root) {
        return {
            ok: false,
            command: ['dotnet', ...command],
            output:
                status.unavailableReason ?? 'Research repository unavailable.',
            exitCode: 1,
        };
    }

    if (!status.localRunEnabled) {
        return {
            ok: false,
            command: ['dotnet', ...command],
            output: 'Local research execution is disabled by RESEARCH_LOCAL_RUN=disabled.',
            exitCode: 1,
        };
    }

    const result = await new Promise<ResearchPipelineResult>((resolve) => {
        const child: ChildProcessWithoutNullStreams = spawn('dotnet', command, {
            cwd: paths.root!,
            env: process.env,
        });
        let output = '';
        const append = (chunk: Buffer) => {
            output += chunk.toString('utf8');
        };
        child.stdout.on('data', append);
        child.stderr.on('data', append);
        child.on('error', (error: Error) => {
            resolve({
                ok: false,
                command: ['dotnet', ...command],
                output: error.message,
                exitCode: 1,
            });
        });
        child.on('close', (code: number | null) => {
            resolve({
                ok: code === 0,
                command: ['dotnet', ...command],
                output,
                exitCode: code ?? 1,
            });
        });
    });
    if (input.destination !== 'zip' || !result.ok) return result;

    const zipResult = await prepareArtifactZip(paths.root!, input.topic);
    return {
        ...result,
        output: `${result.output}\n${zipResult}`,
    };
}

async function prepareArtifactZip(
    rootPath: string,
    topic: string,
): Promise<string> {
    const paths = getResearchPaths(rootPath);
    if (!paths.root || !paths.artifactDir) {
        return '[zip:error] research source is unavailable';
    }

    const artifacts = await listResearchArtifacts(
        rootPath,
        'observatory-local',
        topic,
    );
    if (!artifacts.length) {
        return '[zip] no matching artifacts found after pipeline run';
    }

    const exportRoot =
        process.env.RESEARCH_EXPORT_DIR?.trim() ??
        path.join(os.tmpdir(), 'webwidgets-research-exports');
    await fs.mkdir(exportRoot, { recursive: true });
    const safeTopic =
        topic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'research';
    const zipPath = path.join(exportRoot, `${safeTopic}-${Date.now()}.zip`);
    const files = artifacts
        .map((artifact) => path.join(paths.artifactDir!, `${artifact.id}.json`))
        .filter(Boolean);

    return new Promise((resolve) => {
        const child: ChildProcessWithoutNullStreams = spawn(
            'zip',
            ['-j', zipPath, ...files],
            {
                cwd: paths.root!,
            },
        );
        let output = '';
        child.stdout.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf8');
        });
        child.stderr.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf8');
        });
        child.on('error', (error: Error) => {
            resolve(`[zip:error] ${error.message}`);
        });
        child.on('close', (code: number | null) => {
            resolve(
                code === 0
                    ? `[zip] ready: ${zipPath}`
                    : `[zip:error] ${output || `zip exited with ${code}`}`,
            );
        });
    });
}

async function countMarkdownFiles(rootPath: string): Promise<number> {
    let count = 0;
    const pending = [rootPath];
    while (pending.length && count <= 5000) {
        const current = pending.pop();
        if (!current) continue;
        const entries = await readDirectory(current);
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const entryPath = path.join(current, entry.name);
            if (entry.isDirectory()) pending.push(entryPath);
            if (entry.isFile() && entry.name.endsWith('.md')) count += 1;
        }
    }
    return count;
}

async function listObsidianArtifacts(
    rootPath: string,
    query: string,
): Promise<ResearchArtifactSummary[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const files: string[] = [];
    const pending = [rootPath];
    while (pending.length && files.length < 500) {
        const current = pending.pop();
        if (!current) continue;
        const entries = await readDirectory(current);
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const entryPath = path.join(current, entry.name);
            if (entry.isDirectory()) pending.push(entryPath);
            if (entry.isFile() && entry.name.endsWith('.md')) {
                files.push(entryPath);
            }
        }
    }

    const artifacts: ResearchArtifactSummary[] = [];
    for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf8');
        const title =
            /^#\s+(.+)$/m.exec(content)?.[1]?.trim() ??
            path.basename(filePath, '.md');
        const summary = content
            .replace(/^---[\s\S]*?---/, '')
            .replace(/^#\s+.+$/m, '')
            .trim()
            .slice(0, 320);
        const haystack = `${title} ${summary} ${filePath}`.toLowerCase();
        if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;
        artifacts.push({
            id: path.relative(rootPath, filePath),
            title,
            source: filePath,
            sourceType: 'obsidian',
            category: 'vault-note',
            tags: [],
            summary,
            created: '',
        });
        if (artifacts.length >= 50) break;
    }

    return artifacts;
}

async function readDirectory(filePath: string) {
    try {
        return await fs.readdir(filePath, { withFileTypes: true });
    } catch {
        return [];
    }
}

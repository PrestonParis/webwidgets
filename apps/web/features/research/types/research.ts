export type ResearchPipelineMode = 'explore' | 'academic';

export type ResearchPipelineDestination = 'vault' | 'zip';

export type ResearchSourceKind = 'observatory-local' | 'obsidian-vault';

export interface ResearchSourceConfig {
    id: string;
    name: string;
    kind: ResearchSourceKind;
    rootPath: string;
    createdAt: string;
}

export interface ResearchArtifactSummary {
    id: string;
    title: string;
    source: string;
    sourceType: string;
    category: string;
    tags: string[];
    summary: string;
    created: string;
}

export interface ResearchStatus {
    available: boolean;
    configured: boolean;
    rootPath?: string;
    configPath?: string;
    sourceKind?: ResearchSourceKind;
    vaults: Array<{ name: string; path: string; exists: boolean }>;
    artifactCount: number;
    localRunEnabled: boolean;
    unavailableReason?: string;
}

export interface ResearchPipelineRequest {
    sourceRootPath?: string;
    sourceKind?: ResearchSourceKind;
    topic: string;
    mode: ResearchPipelineMode;
    destination: ResearchPipelineDestination;
    webLimit: number;
    youtubeLimit: number;
    wikiLinks: number;
    tags: string[];
}

export interface ResearchPipelineResult {
    ok: boolean;
    command: string[];
    output: string;
    exitCode: number;
}

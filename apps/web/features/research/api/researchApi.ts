import type {
    ResearchArtifactSummary,
    ResearchPipelineRequest,
    ResearchPipelineResult,
    ResearchSourceKind,
    ResearchStatus,
} from '@/features/research/types/research';

export async function getResearchStatus(
    rootPath?: string,
    sourceKind?: ResearchSourceKind,
): Promise<ResearchStatus> {
    const params = new URLSearchParams();
    if (rootPath?.trim()) params.set('rootPath', rootPath.trim());
    if (sourceKind) params.set('sourceKind', sourceKind);
    const suffix = params.size ? `?${params.toString()}` : '';
    const response = await fetch(`/api/research/status${suffix}`);
    if (!response.ok) throw new Error('Research status unavailable');
    return (await response.json()) as ResearchStatus;
}

export async function listResearchArtifacts(
    rootPath?: string,
    sourceKind?: ResearchSourceKind,
    query = '',
): Promise<ResearchArtifactSummary[]> {
    const params = new URLSearchParams();
    if (rootPath?.trim()) params.set('rootPath', rootPath.trim());
    if (sourceKind) params.set('sourceKind', sourceKind);
    if (query.trim()) params.set('q', query.trim());
    const response = await fetch(`/api/research/artifacts?${params}`);
    if (!response.ok) throw new Error('Research artifacts unavailable');
    const json = (await response.json()) as {
        artifacts: ResearchArtifactSummary[];
    };
    return json.artifacts;
}

export async function runResearchPipeline(
    input: ResearchPipelineRequest,
): Promise<ResearchPipelineResult> {
    const response = await fetch('/api/research/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    const json = (await response.json()) as ResearchPipelineResult & {
        error?: string;
    };
    if (!response.ok) {
        throw new Error(json.error ?? 'Research pipeline failed');
    }
    return json;
}

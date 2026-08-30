import { apiRouteFetch } from '@/lib/api/client';
import type {
    AutomationSummary,
    BriefingSummary,
    Candidate,
    CommandTask,
    SeenState,
    RuntimeHealth,
    SourceHealth,
    TimelineChange,
} from '../types/commandCenter';

async function jsonRequest<T>(path: `/api/${string}`, init?: RequestInit) {
    const response = await apiRouteFetch(path, init);
    if (!response.ok) throw new Error(`command_center_${response.status}`);
    return response.json() as Promise<T>;
}

export async function fetchTimelineSummary() {
    const response = await jsonRequest<{
        items: TimelineChange[];
        sources: SourceHealth[];
        sourceHealthUnavailable: boolean;
    }>('/api/news/feed?limit=8');
    return response;
}

export async function fetchBriefingSummary() {
    const response = await jsonRequest<{ briefing: BriefingSummary | null }>(
        '/api/briefings',
    );
    return response.briefing;
}

export async function fetchCandidates() {
    const response = await jsonRequest<{ candidates: Candidate[] }>(
        '/api/commitment-candidates',
    );
    return response.candidates;
}

export async function reviewCandidate(
    candidateId: string,
    body: Record<string, unknown>,
) {
    return jsonRequest(`/api/commitment-candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export async function fetchTasks() {
    const response = await jsonRequest<{ todos: CommandTask[] }>('/api/todos');
    return response.todos;
}

export function completeTask(id: string) {
    return jsonRequest(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
    });
}

export function fetchAutomationSummary() {
    return jsonRequest<AutomationSummary>('/api/automation-center');
}

export function setAutomationPaused(paused: boolean) {
    return jsonRequest('/api/automation-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'pause_all', enabled: paused }),
    });
}

export function fetchSeenState() {
    return jsonRequest<SeenState>('/api/command-center/seen');
}

export function markCommandCenterSeen() {
    return jsonRequest<SeenState>('/api/command-center/seen', {
        method: 'POST',
    });
}

export function fetchRuntimeHealth() {
    return jsonRequest<RuntimeHealth>('/api/command-center/health');
}

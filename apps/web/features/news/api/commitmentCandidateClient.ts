import type { CommitmentCandidateRecord } from '@/lib/commitments/types';

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok)
        throw new Error(`Candidate request failed: ${response.status}`);
    return response.json() as Promise<T>;
}

export function fetchCommitmentCandidates() {
    return jsonRequest<{ candidates: CommitmentCandidateRecord[] }>(
        '/api/commitment-candidates',
    );
}

export function generateCommitmentCandidates() {
    return jsonRequest<{ candidateCount: number }>(
        '/api/commitment-candidates',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lookbackDays: 14 }),
        },
    );
}

export function reviewCommitmentCandidate(
    candidateId: string,
    body: Record<string, unknown>,
) {
    return jsonRequest<{ state: string }>(
        `/api/commitment-candidates/${candidateId}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        },
    );
}

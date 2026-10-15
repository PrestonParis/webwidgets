import { apiRouteFetch } from '@/lib/api/client';
import {
    briefingPreferencesRequestSchema,
    briefingResponseSchema,
} from '@/lib/briefings/schemas';
import type {
    BriefingFeedbackRating,
    BriefingPreferences,
    BriefingResponse,
} from '@/lib/briefings/types';

function expectSuccess(response: Response) {
    if (!response.ok) throw new Error(`briefing_request_${response.status}`);
}

export async function fetchBriefing(): Promise<BriefingResponse> {
    const response = await apiRouteFetch('/api/briefings');
    expectSuccess(response);
    return briefingResponseSchema.parse(await response.json());
}

export async function requestBriefing(windowHours: number) {
    const response = await apiRouteFetch('/api/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windowHours }),
    });
    expectSuccess(response);
}

export async function saveBriefingPreferences(
    preferences: BriefingPreferences,
) {
    const payload = briefingPreferencesRequestSchema.parse(preferences);
    const response = await apiRouteFetch('/api/briefings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    expectSuccess(response);
}

export async function saveBriefingFeedback(
    briefingId: string,
    itemId: string,
    rating: BriefingFeedbackRating,
) {
    const path =
        `/api/briefings/${briefingId}/items/${itemId}/feedback` as `/api/${string}`;
    const response = await apiRouteFetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
    });
    expectSuccess(response);
}

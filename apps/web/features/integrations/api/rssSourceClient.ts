import { z } from 'zod';
import { rssSourceSchema } from '@/features/integrations/types/rssSources';
import { apiRouteFetch } from '@/lib/api/client';

const listSchema = z.object({ sources: z.array(rssSourceSchema) });
const sourceResponseSchema = z.object({ source: rssSourceSchema });

export async function fetchRssSources() {
    const response = await apiRouteFetch('/api/integrations/rss');
    if (!response.ok) throw new Error('Unable to load RSS sources');
    return listSchema.parse(await response.json()).sources;
}

export async function createRssSource(url: string) {
    const response = await apiRouteFetch('/api/integrations/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fetchIntervalMinutes: 30 }),
    });
    if (!response.ok) throw new Error('Enter a public RSS or Atom feed URL');
    return sourceResponseSchema.parse(await response.json()).source;
}

export async function removeRssSource(id: string) {
    const response = await apiRouteFetch(`/api/integrations/rss/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Unable to disable RSS source');
}

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listActivityEvents } from '@/features/activity/services/activityService';
import { createArtifact } from '@/features/artifacts/services/artifactService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

// POST /api/activity/digest
// Generates a structured digest from recent activity.
// Optionally creates a persisted artifact.
//
// Body: {
//   range: 'today' | '7d' | '30d';
//   includeArchived?: boolean;
//   createArtifact?: boolean;
// }

const RANGE_HOURS: Record<string, number> = {
    today: 24,
    '7d': 7 * 24,
    '30d': 30 * 24,
};

function buildDigestPrompt(
    events: {
        title: string;
        source: string;
        eventType?: string;
        occurredAt: string;
    }[],
    rangeLabel: string,
): string {
    const lines = events.map((e) => {
        const ts = new Date(e.occurredAt).toLocaleString();
        const type = e.eventType ? ` (${e.eventType})` : '';
        return `- [${ts}] ${e.source}${type}: ${e.title}`;
    });

    return `You are summarizing a user's personal operating system activity for the ${rangeLabel}.

Here are the recent activity events:

${lines.join('\n')}

Write a concise, professional activity digest in Markdown format with these sections:
1. **Summary** - 2-3 sentence overview of what happened
2. **Highlights** - 3-5 bullet points of the most significant activities
3. **By Area** - Group notable events by category (AI/Content, Tasks, Finance, etc.) — only include non-empty categories
4. **Needs Attention** - Any failures, warnings, or items that may need follow-up (omit if none)

Be specific, not generic. Use actual event titles. Keep it under 400 words.`;
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as {
            range?: string;
            includeArchived?: boolean;
            createArtifact?: boolean;
        };

        const range = body.range ?? '7d';
        const hours = RANGE_HOURS[range] ?? 168;
        const since = new Date(Date.now() - hours * 3_600_000).toISOString();

        const options: { limit: number; since: string; archived?: boolean } = {
            limit: 100,
            since,
        };
        if (!body.includeArchived) {
            options.archived = false;
        }
        const events = await listActivityEvents(supabase, userId, options);

        if (events.length === 0) {
            return NextResponse.json({
                title: `Activity Digest — ${range}`,
                summary: 'No activity recorded in this period.',
                sections: [],
                topEvents: [],
                recommendations: [],
                artifactId: null,
            });
        }

        const rangeLabels: Record<string, string> = {
            today: 'past 24 hours',
            '7d': 'past 7 days',
            '30d': 'past 30 days',
        };
        const rangeLabel = rangeLabels[range] ?? range;

        // Check for API key — Claude is optional
        const apiKey = process.env.ANTHROPIC_API_KEY;
        let digestContent = '';

        if (apiKey) {
            try {
                const client = new Anthropic({ apiKey });
                const response = await client.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 800,
                    messages: [
                        {
                            role: 'user',
                            content: buildDigestPrompt(events, rangeLabel),
                        },
                    ],
                });
                const textBlock = response.content.find(
                    (b) => b.type === 'text',
                );
                digestContent =
                    textBlock?.type === 'text' ? textBlock.text : '';
            } catch {
                // Claude unavailable — fall back to structured summary
            }
        }

        // Structured fallback if Claude is unavailable or produces no output
        if (!digestContent) {
            const bySource = new Map<string, number>();
            for (const e of events) {
                bySource.set(e.source, (bySource.get(e.source) ?? 0) + 1);
            }
            const sourceSummary = Array.from(bySource.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([s, n]) => `- **${s}**: ${n} event${n > 1 ? 's' : ''}`)
                .join('\n');

            digestContent = [
                `## Activity Digest — ${rangeLabel}`,
                '',
                `**${events.length} events** recorded across ${bySource.size} source${bySource.size > 1 ? 's' : ''}.`,
                '',
                '### By Source',
                sourceSummary,
                '',
                '### Recent Events',
                ...events.slice(0, 10).map((e) => `- ${e.title}`),
            ].join('\n');
        }

        const title = `Activity Digest — ${rangeLabel}`;
        let artifactId: string | null = null;

        if (body.createArtifact) {
            try {
                const artifact = await createArtifact(supabase, userId, {
                    type: 'summary',
                    title,
                    content: digestContent,
                    contentFormat: 'markdown',
                    tags: ['activity', 'digest', range],
                });
                artifactId = artifact.id;

                await publishActivityEventSafe(supabase, {
                    userId,
                    source: 'artifact',
                    eventType: 'artifact.generated',
                    sourceId: artifact.id,
                    sourceTable: 'artifacts',
                    category: 'ai',
                    severity: 'success',
                    priority: 'normal',
                    title: `Activity digest generated: ${rangeLabel}`,
                    actionUrl: `/artifacts/${artifact.id}`,
                    metadata: {
                        artifactType: 'summary',
                        range,
                        eventCount: events.length,
                    },
                });
            } catch {
                // Artifact creation failed — still return digest content
            }
        }

        return NextResponse.json({
            title,
            summary: digestContent,
            eventCount: events.length,
            range,
            artifactId,
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json(
                { error: 'TABLE_NOT_FOUND' },
                { status: 503 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

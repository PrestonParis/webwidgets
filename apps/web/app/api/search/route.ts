import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

interface SearchResult {
    type: 'file' | 'document' | 'artifact';
    id: string;
    title: string;
    snippet?: string;
    updatedAt: string;
    href: string;
}

export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.trim() ?? '';
        const typesParam =
            searchParams.get('types') ?? 'files,documents,artifacts';
        const types = typesParam.split(',').map((t) => t.trim());

        if (!q || q.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const results: SearchResult[] = [];
        const likeQ = `%${q}%`;

        // Files
        if (types.includes('files')) {
            try {
                const { data } = await supabase
                    .from('file_uploads')
                    .select('id, original_name, created_at')
                    .eq('user_id', userId)
                    .ilike('original_name', likeQ)
                    .order('created_at', { ascending: false })
                    .limit(10);

                for (const row of (data ?? []) as unknown as Array<{
                    id: string;
                    original_name: string;
                    created_at: string;
                }>) {
                    results.push({
                        type: 'file',
                        id: row.id,
                        title: row.original_name,
                        updatedAt: row.created_at,
                        href: `/files/${row.id}`,
                    });
                }
            } catch {
                // Graceful: skip file results if table missing
            }
        }

        // Documents
        if (types.includes('documents')) {
            try {
                const { data } = await supabase
                    .from('documents')
                    .select('id, title, content, updated_at')
                    .eq('user_id', userId)
                    .is('deleted_at', null)
                    .or(`title.ilike.${likeQ},content.ilike.${likeQ}`)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                for (const row of (data ?? []) as unknown as Array<{
                    id: string;
                    title: string;
                    content: string;
                    updated_at: string;
                }>) {
                    results.push({
                        type: 'document',
                        id: row.id,
                        title: row.title,
                        snippet: row.content.slice(0, 200),
                        updatedAt: row.updated_at,
                        href: `/documents/${row.id}`,
                    });
                }
            } catch {
                // Graceful: skip document results if table missing
            }
        }

        // Artifacts
        if (types.includes('artifacts')) {
            try {
                const { data } = await supabase
                    .from('artifacts')
                    .select('id, title, content, updated_at')
                    .eq('user_id', userId)
                    .is('deleted_at', null)
                    .or(`title.ilike.${likeQ},content.ilike.${likeQ}`)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                for (const row of (data ?? []) as unknown as Array<{
                    id: string;
                    title: string;
                    content: string;
                    updated_at: string;
                }>) {
                    results.push({
                        type: 'artifact',
                        id: row.id,
                        title: row.title,
                        snippet: row.content.slice(0, 200),
                        updatedAt: row.updated_at,
                        href: `/artifacts/${row.id}`,
                    });
                }
            } catch {
                // Graceful: skip artifact results if table missing
            }
        }

        // Sort all results by updatedAt desc
        results.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        );

        return NextResponse.json({ results });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err)) return NextResponse.json({ results: [] });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

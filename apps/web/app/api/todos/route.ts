import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import {
    ingestContextEdge,
    ingestContextNode,
} from '@/features/context/services/contextService';
import { z } from 'zod';

const createTodoSchema = z.object({
    text: z.string().trim().min(1).max(2000),
    dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function GET(): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { data, error } = await supabase
            .from('todos')
            .select(
                'id, text, completed, created_at, completed_at, due_at, updated_at',
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) {
            if (isMissingTableError(error))
                return NextResponse.json({ todos: [] });
            throw error;
        }
        return NextResponse.json({ todos: data ?? [] });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = createTodoSchema.safeParse(await req.json());
        if (!parsed.success)
            return NextResponse.json(
                { error: 'INVALID_TODO' },
                { status: 400 },
            );

        const { data, error } = await supabase
            .from('todos')
            .insert({
                user_id: userId,
                text: parsed.data.text,
                ...(parsed.data.dueAt !== undefined
                    ? { due_at: parsed.data.dueAt }
                    : {}),
            })
            .select(
                'id, text, completed, created_at, completed_at, due_at, updated_at',
            )
            .single();
        if (error) throw error;

        const todo = data as { id: string; text: string };
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'todo',
            eventType: 'todo.created',
            sourceId: todo.id,
            sourceTable: 'todos',
            category: 'content',
            severity: 'info',
            priority: 'normal',
            title: `Task created: ${todo.text}`,
            actionUrl: '/',
            metadata: { todoId: todo.id, text: todo.text },
        });
        await ingestContextNode(supabase, userId, {
            entityId: `todo:${todo.id}`,
            type: 'todo',
            label: todo.text,
            summary: todo.text,
            data: { completed: false },
            tags: ['todo'],
            sourceType: 'todos',
            sourceId: todo.id,
            sourceTable: 'todos',
            createdByType: 'user',
            permissions: ['private', 'ai', 'cross_widget'],
        });
        await ingestContextEdge(supabase, userId, {
            fromEntityId: 'widget:todo',
            toEntityId: `todo:${todo.id}`,
            kind: 'produced_by',
            label: 'created in Todo widget',
            sourceType: 'todos',
            sourceId: todo.id,
            createdByType: 'system',
            metadata: { eventType: 'todo.created' },
        });

        return NextResponse.json({ todo: data }, { status: 201 });
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

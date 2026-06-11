import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import {
    ingestContextNode,
    markContextStatus,
} from '@/features/context/services/contextService';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
    req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as {
            text?: string;
            completed?: boolean;
        };

        const update: Record<string, unknown> = {};
        if (body.text !== undefined) update.text = body.text.trim();
        if (body.completed !== undefined) {
            update.completed = body.completed;
            update.completed_at = body.completed
                ? new Date().toISOString()
                : null;
        }

        if (Object.keys(update).length === 0)
            return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });

        const { data, error } = await supabase
            .from('todos')
            .update(update)
            .eq('id', id)
            .eq('user_id', userId)
            .select('id, text, completed, created_at, completed_at')
            .single();
        if (error) throw error;

        const todo = data as { id: string; text: string; completed: boolean };
        await ingestContextNode(supabase, userId, {
            entityId: `todo:${todo.id}`,
            type: 'todo',
            label: todo.text,
            summary: todo.text,
            data: { completed: todo.completed },
            tags: ['todo', todo.completed ? 'completed' : 'open'],
            sourceType: 'todos',
            sourceId: todo.id,
            sourceTable: 'todos',
            createdByType: 'user',
            status: todo.completed ? 'archived' : 'active',
            permissions: ['private', 'ai', 'cross_widget'],
        });

        // Determine which event to publish
        if (body.completed === true) {
            await publishActivityEventSafe(supabase, {
                userId,
                source: 'todo',
                eventType: 'todo.completed',
                sourceId: todo.id,
                sourceTable: 'todos',
                category: 'content',
                severity: 'success',
                priority: 'normal',
                title: `Task completed: ${todo.text}`,
                actionUrl: '/',
                metadata: { todoId: todo.id, text: todo.text },
            });
        } else if (body.completed === false) {
            await publishActivityEventSafe(supabase, {
                userId,
                source: 'todo',
                eventType: 'todo.reopened',
                sourceId: todo.id,
                sourceTable: 'todos',
                category: 'content',
                severity: 'info',
                priority: 'low',
                title: `Task reopened: ${todo.text}`,
                metadata: { todoId: todo.id },
            });
        } else if (body.text !== undefined) {
            await publishActivityEventSafe(supabase, {
                userId,
                source: 'todo',
                eventType: 'todo.updated',
                sourceId: todo.id,
                sourceTable: 'todos',
                category: 'content',
                severity: 'info',
                priority: 'low',
                title: `Task updated: ${todo.text}`,
                metadata: { todoId: todo.id },
            });
        }

        return NextResponse.json({ todo: data });
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

export async function DELETE(
    _req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        // Fetch text before deletion for the activity event
        const { data: existing } = await supabase
            .from('todos')
            .select('text')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;

        const todoText =
            (existing as { text?: string } | null)?.text ?? 'Unknown task';
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'todo',
            eventType: 'todo.deleted',
            sourceId: id,
            sourceTable: 'todos',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Task deleted: ${todoText}`,
            metadata: { todoId: id },
        });
        await markContextStatus(supabase, userId, `todo:${id}`, 'deleted');

        return new Response(null, { status: 204 });
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

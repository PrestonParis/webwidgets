import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createClients } from '@/lib/supabase/serverClient';
import { executeAutomationCommand } from './_lib/commands';
import { loadAutomationCenter } from './_lib/data';

const commandSchema = z.discriminatedUnion('command', [
    z.strictObject({ command: z.literal('create_fixture') }),
    z.strictObject({
        command: z.literal('create_template'),
        definitionId: z.enum([
            'v1.commitment-capture',
            'v1.daily-briefing',
            'v1.calendar-preparation',
            'v1.stale-task-review',
        ]),
        localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        timezone: z.string().min(1).max(100),
        dryRun: z.boolean(),
    }),
    z.strictObject({
        command: z.literal('configure'),
        id: z.uuid(),
        localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        timezone: z.string().min(1).max(100),
        dryRun: z.boolean(),
    }),
    z.strictObject({
        command: z.literal('set_state'),
        id: z.uuid(),
        enabled: z.boolean(),
    }),
    z.strictObject({
        command: z.literal('trigger'),
        id: z.uuid(),
        dryRun: z.boolean().optional(),
    }),
    z.strictObject({
        command: z.literal('decide'),
        id: z.uuid(),
        decision: z.enum(['approved', 'denied']),
        payloadVersion: z.number().int().positive(),
        payloadHash: z.string().min(1).max(128),
    }),
    z.strictObject({ command: z.literal('pause_all'), enabled: z.boolean() }),
    z.strictObject({ command: z.literal('archive'), id: z.uuid() }),
    z.strictObject({
        command: z.literal('dismiss'),
        id: z.string().min(1).max(120),
    }),
    z.strictObject({ command: z.literal('retry'), id: z.uuid() }),
    z.strictObject({
        command: z.literal('upsert_deliverable'),
        id: z.uuid().optional(),
        name: z.string().trim().min(1).max(120),
        sourceWidgets: z.array(z.string().min(1).max(100)).max(20),
        outputType: z.enum([
            'summary',
            'report',
            'digest',
            'briefing',
            'export',
        ]),
        schedule: z.record(z.string(), z.unknown()),
        deliveryDestination: z.enum([
            'dashboard_notification',
            'inbox',
            'email_draft',
            'calendar_suggestion',
            'download',
        ]),
        approvalMode: z.enum(['auto', 'review']),
        enabled: z.boolean(),
        userId: z.string().optional(),
    }),
]);

function errorResponse(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Unauthorized')
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (error instanceof z.ZodError)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    return NextResponse.json(
        { error: 'automation_command_conflict' },
        { status: 409 },
    );
}

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json(await loadAutomationCenter(supabase, userId));
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const input = commandSchema.parse(await request.json());
        return NextResponse.json(
            await executeAutomationCommand(supabase, userId, input),
        );
    } catch (error) {
        return errorResponse(error);
    }
}
